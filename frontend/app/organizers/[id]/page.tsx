'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { usemutation } from '@/lib/hooks/usemutation'
import { useauth } from '@/lib/authcontext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Mail, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { organizer, event } from '@/lib/types'
import { toast } from 'sonner'

export default function OrganizerDetailsPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()
  const { user } = useauth()
  
  const { data: organizerData, loading: orgLoading, error: orgError } = usefetch<organizer>(`/api/organizers/${id}`)
  const { data: eventsData, loading: eventsLoading } = usefetch<{ events: event[] } | event[]>(`/api/events?organizer=${id}`)
  
  const events = Array.isArray(eventsData) ? eventsData : (eventsData?.events || [])
  const upcomingEvents = events.filter(e => e.status === 'published' || e.status === 'ongoing')
  const pastEvents = events.filter(e => e.status === 'completed')

  const { mutate: toggleFollow, loading: followLoading } = usemutation(`/api/organizers/${id}/follow`, {
    method: 'POST',
    onsuccess: () => {
      toast.success('Updated')
      window.location.reload()
    }
  })

  const handleFollow = () => {
    if (user?.role !== 'Participant') return
    toggleFollow({})
  }

  if (orgLoading) {
    return <OrganizerSkeleton />
  }

  if (orgError || !organizerData) {
    return (
      <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Organizer not found</h1>
          <p className="text-muted-foreground">{orgError || "The organizer you're looking for doesn't exist."}</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-4xl mx-auto px-8 md:px-12 py-8">
        
        <div className="space-y-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-base">{organizerData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{organizerData.name}</h1>
                <p className="text-sm text-muted-foreground">{organizerData.category}</p>
              </div>
            </div>
            
            {user?.role === 'Participant' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? 'Processing...' : 'Follow'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {organizerData.followers !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{organizerData.followers} followers</span>
              </div>
            )}
            {organizerData.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${organizerData.email}`} className="hover:underline">
                  {organizerData.email}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
            
            {organizerData.description && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{organizerData.description}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Events</h2>
                <span className="text-xs text-muted-foreground">{events.length} total</span>
              </div>

              {eventsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-6">
                  {upcomingEvents.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming</h3>
                      <div className="space-y-3">
                        {upcomingEvents.map(event => (
                          <EventItem key={event._id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}

                  {pastEvents.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past</h3>
                      <div className="space-y-3">
                        {pastEvents.map(event => (
                          <EventItem key={event._id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No events yet
                </div>
              )}
            </div>
        </div>
      </div>
    </AppLayout>
  )
}

function EventItem({ event }: { event: event }) {
  const date = new Date(event.dates.start)
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  
  return (
    <Link href={`/events/${event._id}`} className="block">
      <div className="flex items-center gap-4 p-3 rounded-md border hover:bg-muted/50 transition-colors">
        <div className="flex-shrink-0 w-12 h-12 rounded-md bg-muted border flex flex-col items-center justify-center">
          <span className="text-lg font-semibold leading-none">{day}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{month}</span>
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">{event.name}</h4>
            <Badge variant="outline" className="font-normal text-xs">{event.type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{event.description || 'No description'}</p>
        </div>
        
        {event.fee !== undefined && event.fee > 0 && (
          <div className="flex-shrink-0 text-sm font-medium">₹{event.fee}</div>
        )}
      </div>
    </Link>
  )
}

function OrganizerSkeleton() {
  return (
    <AppLayout roles={['Participant']}>
      <div className="max-w-4xl mx-auto px-8 md:px-12 py-8">
        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </AppLayout>
  )
}
