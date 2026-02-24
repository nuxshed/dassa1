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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, Share2, Tag, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { event, registration } from '@/lib/types'
import { toast } from 'sonner'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

export default function EventDetailsPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()
  const { user } = useauth()
  
  const { data: eventData, loading: eventLoading, error: eventError } = usefetch<event>(`/api/events/${id}`)
  const { data: regData, loading: regLoading, refetch: refetchRegs } = usefetch<{ registrations: registration[] }>('/api/registrations/me')
  
  const myRegs = regData?.registrations?.filter(r => 
    (typeof r.event === 'object' ? r.event._id : r.event) === id
  ) || []

  const isRegistered = myRegs.length > 0
  const isMerch = eventData?.type === 'Merchandise'
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
              {isMerch ? (
                <MerchCard event={eventData} orders={myRegs} onPurchase={refetchRegs} />
              ) : (
                <RegistrationCard event={eventData} registration={myRegs[0]} isRegistered={isRegistered} />
              )}
              
              <OrganizerCard organizer={eventData.organizer} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function RegistrationCard({ event, registration, isRegistered }: { event: any, registration?: registration, isRegistered: boolean }) {
  const { data: formData } = usefetch<{ fields: any[] }>(`/api/events/${event._id}/form`)
  const { mutate, loading } = usemutation(`/api/events/${event._id}/registrations`, {
    onsuccess: () => {
      toast.success("Registered successfully!")
      window.location.reload()
    }
  })
  
  const { token } = useauth()

  const fields = formData?.fields || []
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({})

  const updateValue = (label: string, value: any) => {
    setFormValues(prev => ({ ...prev, [label]: value }))
  }

  const handleFileUpload = async (label: string, file: File | undefined) => {
    if (!file) return
    setUploadingFields(prev => ({ ...prev, [label]: true }))
    
    try {
      const fd = new FormData()
      fd.append('file', file)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      updateValue(label, url)
      toast.success('File uploaded successfully')
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setUploadingFields(prev => ({ ...prev, [label]: false }))
    }
  }

  const handleRegister = async () => {
    if (Object.values(uploadingFields).some(v => v)) {
      toast.error("Please wait for all file uploads to finish")
      return
    }

    if (fields.length > 0) {
      for (const field of fields) {
        if (field.required) {
          const val = formValues[field.label]
          if (val === undefined || val === '' || val === false) {
            toast.error(`${field.label} is required`)
            return
          }
        }
      }
    }

    try {
      const formdata = fields.length > 0
        ? fields.map((f: any) => ({ label: f.label, value: formValues[f.label] ?? '' }))
        : undefined
      await mutate({ formdata })
    } catch (e) {
      toast.error("Failed to register. Please try again.")
    }
  }

  const isFull = (event.regcount || 0) >= (event.limit || Infinity)
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
               <Link href={`/registrations/${registration?.ticketid}`}>View Ticket</Link>
             </Button>
           </div>
         ) : (
           <>
             <div className="space-y-2">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Capacity</span>
                 <span className="font-medium">{event.regcount || 0} / {event.limit || '∞'}</span>
               </div>
               <div className="h-1 bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-foreground transition-all" 
                   style={{ width: `${Math.min(100, ((event.regcount || 0) / (event.limit || 1)) * 100)}%` }}
                 />
               </div>
             </div>

             {canRegister && fields.length > 0 && (
               <div className="space-y-3 pt-1">
                 {fields.map((field: any, i: number) => (
                   <div key={i} className="space-y-1.5">
                     <label className="text-xs font-medium flex justify-between">
                       <span>{field.label}{field.required && <span className="text-destructive ml-0.5">*</span>}</span>
                       {uploadingFields[field.label] && <span className="text-muted-foreground text-[10px]">Uploading...</span>}
                     </label>
                     {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                       <Input
                         type={field.type}
                         placeholder={field.label}
                         value={formValues[field.label] || ''}
                         onChange={e => updateValue(field.label, field.type === 'number' ? e.target.value : e.target.value)}
                         className="h-8 text-sm"
                       />
                     ) : field.type === 'textarea' ? (
                       <Textarea
                         placeholder={field.label}
                         value={formValues[field.label] || ''}
                         onChange={e => updateValue(field.label, e.target.value)}
                         rows={3}
                         className="text-sm"
                       />
                     ) : field.type === 'select' ? (
                       <Select
                         value={formValues[field.label] || ''}
                         onValueChange={v => updateValue(field.label, v)}
                       >
                         <SelectTrigger className="h-8 text-sm">
                           <SelectValue placeholder={`Select ${field.label}`} />
                         </SelectTrigger>
                         <SelectContent>
                           {(field.options || []).map((opt: string) => (
                             <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     ) : field.type === 'checkbox' ? (
                       <div className="flex items-center gap-2">
                         <Checkbox
                           checked={formValues[field.label] || false}
                           onCheckedChange={v => updateValue(field.label, v)}
                         />
                         <span className="text-xs text-muted-foreground">Yes</span>
                       </div>
                     ) : field.type === 'file' ? (
                       <Input
                         type="file"
                         onChange={e => handleFileUpload(field.label, e.target.files?.[0])}
                         disabled={uploadingFields[field.label]}
                         className="h-8 text-sm"
                       />
                     ) : null}
                   </div>
                 ))}
               </div>
             )}

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

function MerchCard({ event, orders, onPurchase }: { event: any, orders: registration[], onPurchase: () => void }) {
  const { mutate, loading } = usemutation(`/api/events/${event._id}/registrations`, {
    onsuccess: () => {
      toast.success("Order placed!")
      onPurchase()
    }
  })

  const [selectedVariant, setSelectedVariant] = useState('')
  const variants = (event as any).variants || []

  const handlePurchase = async () => {
    try {
      const variant = variants.find((v: any) => v.name === selectedVariant)
      if (!variant) return
      await mutate({
        formdata: [
          { name: 'Variant', label: 'Variant', value: variant.name },
        ]
      })
      setSelectedVariant('')
    } catch (e) {
      toast.error("Failed to purchase. Please try again.")
    }
  }

  const isPastDeadline = new Date() > new Date(event.dates.deadline)
  const canPurchase = !isPastDeadline && event.status === 'published'
  const selectedVariantData = variants.find((v: any) => v.name === selectedVariant)
  const variantOutOfStock = selectedVariantData && selectedVariantData.stock <= 0

  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Purchase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canPurchase && variants.length > 0 && (
          <>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Select variant</p>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose a variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v: any) => (
                    <SelectItem key={v.name} value={v.name} disabled={v.stock <= 0}>
                      {v.name} {v.price > 0 ? `· ₹${v.price}` : ''} {v.stock <= 0 ? '(Out of stock)' : `(${v.stock} left)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handlePurchase}
              disabled={!selectedVariant || variantOutOfStock || loading}
            >
              {loading ? "Processing..." : selectedVariantData?.price ? `Purchase · ₹${selectedVariantData.price}` : 'Purchase'}
            </Button>
          </>
        )}

        {!canPurchase && (
          <p className="text-xs text-muted-foreground">
            {isPastDeadline ? 'Purchase deadline has passed.' : 'Purchases are currently closed.'}
          </p>
        )}

        {orders.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <p className="text-xs text-muted-foreground">Your orders ({orders.length})</p>
            <div className="space-y-2">
              {orders.map(order => {
                const variantName = order.formdata?.find((f: any) => f.name === 'Variant' || f.label === 'Variant')?.value
                return (
                  <Link key={order.ticketid} href={`/registrations/${order.ticketid}`}>
                    <div className="p-2.5 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{variantName || 'Order'}</span>
                        <MerchStatusBadge status={order.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">{order.ticketid}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MerchStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Registered':
      return <Badge variant="outline" className="text-xs">Awaiting Proof</Badge>
    case 'Pending':
      return <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
    case 'Purchased':
      return <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Confirmed</Badge>
    case 'Rejected':
      return <Badge variant="destructive" className="text-xs">Rejected</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
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
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
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
