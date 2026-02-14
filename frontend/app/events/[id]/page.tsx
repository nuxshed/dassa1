'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { usemutation } from '@/lib/hooks/usemutation'
import { useauth } from '@/lib/authcontext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, Share2, Tag, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { event, registration } from '@/lib/types'
import { toast } from 'sonner'
import { useState } from 'react'

export default function EventDetailsPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()
  const { user } = useauth()
  
  const { data: eventData, loading: eventLoading, error: eventError } = usefetch<event>(`/api/events/${id}`)
  const { data: regData, loading: regLoading } = usefetch<{ registrations: registration[] }>('/api/registrations/me')
  
  const registration = regData?.registrations?.find(r => 
    (typeof r.event === 'object' ? r.event._id : r.event) === id
  )

  const isRegistered = !!registration
  const isOrganizer = user?.role === 'Organizer'
  const isMyEvent = isOrganizer && typeof eventData?.organizer === 'object' && eventData.organizer._id === user?._id || eventData?.organizer === user?._id

  const handleShare = async () => {
    try {
      await navigator.share({
        title: eventData?.name,
        text: eventData?.description,
        url: window.location.href,
      })
    } catch (err) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  if (eventLoading || regLoading) {
    return <EventSkeleton />
  }

  if (eventError || !eventData) {
    return (
      <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">{eventError || "The event you're looking for doesn't exist or is unavailable."}</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-6xl mx-auto px-8 md:px-12 py-8">
        
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-normal">{eventData.type}</Badge>
              {eventData.status !== 'published' && (
                <Badge variant="outline">{eventData.status}</Badge>
              )}
              {isMyEvent && <Badge variant="outline">Your Event</Badge>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{eventData.name}</h1>
            <p className="text-sm text-muted-foreground">
              by{' '}
              <Link href={`/organizer/${typeof eventData.organizer === 'object' ? eventData.organizer._id : eventData.organizer}`} className="hover:underline">
                {typeof eventData.organizer === 'object' ? eventData.organizer.name : 'Unknown'}
              </Link>
            </p>
          </div>
          
          <div className="flex gap-1">
            {isMyEvent && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/organizer/events/${eventData._id}/edit`}>Edit</Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-6">
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{new Date(eventData.dates.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">{new Date(eventData.dates.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium">{new Date(eventData.dates.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-medium mb-3">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{eventData.description}</p>
              </div>

              {eventData.tags && eventData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {eventData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="sticky top-8 space-y-4">
              <RegistrationCard event={eventData} registration={registration} isRegistered={isRegistered} />
              
              <OrganizerCard organizer={eventData.organizer} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function RegistrationCard({ event, registration, isRegistered }: { event: event, registration?: registration, isRegistered: boolean }) {
  const { mutate, loading } = usemutation(`/api/events/${event._id}/registrations`, {
    onsuccess: () => {
      toast.success("Registered successfully!")
      window.location.reload()
    }
  })

  const [selectedVariant, setSelectedVariant] = useState<{size?: string, color?: string}>({})

  const handleRegister = async () => {
    try {
      await mutate({
         formdata: { ...selectedVariant }
      })
    } catch (e) {
      toast.error("Failed to register. Please try again.")
    }
  }

  const isFull = (event.registrationCount || 0) >= (event.registrationLimit || Infinity)
  const isPastDeadline = new Date() > new Date(event.dates.deadline)
  const canRegister = !isRegistered && !isFull && !isPastDeadline && event.status === 'published'

  return (
    <Card className="bg-muted/20">
       <CardHeader>
         <div className="flex items-center justify-between">
           <CardTitle className="text-sm font-medium">Registration</CardTitle>
           {isRegistered && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {isRegistered ? (
           <div className="space-y-3">
             <div className="p-3 rounded-md bg-muted/50 border">
               <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
               <p className="font-mono text-sm font-medium">{registration?.ticketid}</p>
             </div>
             <Button variant="outline" size="sm" className="w-full" asChild>
               <Link href="/dashboard">View Tickets</Link>
             </Button>
           </div>
         ) : (
           <>
             <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Capacity</span>
                 <span className="font-medium">{event.registrationCount || 0} / {event.registrationLimit || '∞'}</span>
               </div>
               <div className="h-1 bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-foreground transition-all" 
                   style={{ width: `${Math.min(100, ((event.registrationCount || 0) / (event.registrationLimit || 1)) * 100)}%` }}
                 />
               </div>
             </div>
             <Button 
               size="sm"
               className="w-full" 
               onClick={handleRegister} 
               disabled={!canRegister || loading}
             >
               {loading ? "Processing..." : event.fee ? `Register · ₹${event.fee}` : "Register"}
             </Button>
           </>
         )}
       </CardContent>
    </Card>
  )
}

function OrganizerCard({ organizer }: { organizer: string | any }) {
  if (typeof organizer !== 'object') return null
  
  return (
    <Card className="bg-muted/20">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{organizer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{organizer.name}</p>
            <p className="text-xs text-muted-foreground truncate">{organizer.category}</p>
          </div>
        </div>
        {organizer.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{organizer.description}</p>
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/organizer/${organizer._id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function EventSkeleton() {
  return (
    <AppLayout roles={['Participant']}>
      <div className="max-w-6xl mx-auto px-8 md:px-12 py-8">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
