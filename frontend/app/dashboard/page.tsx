'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportCalendarButton } from '@/components/export-calendar-button'
import Link from 'next/link'
import type { registration, event } from '@/lib/types'

export default function DashboardPage() {
  const { data, loading } = usefetch<{ registrations: registration[] }>('/api/registrations/me')

  const getev = (reg: registration): event | null => typeof reg.event === 'object' ? reg.event : null

  const allRegs = data?.registrations || []

  const upcoming = allRegs.filter(r => 
    r.status === 'Registered' || r.status === 'Confirmed' || r.status === 'Pending' || r.status === 'Purchased'
  )

  const normal = upcoming.filter(r => getev(r)?.type === 'Normal')
  const merchandise = upcoming.filter(r => getev(r)?.type === 'Merchandise')

  const completed = allRegs.filter(r => {
    const ev = getev(r)
    return ev?.status === 'completed'
  })

  const cancelled = allRegs.filter(r => r.status === 'Cancelled' || r.status === 'Rejected')

  return (
    <AppLayout roles={['Participant']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {upcoming.length > 0 && (
            <ExportCalendarButton events={upcoming.map(r => getev(r)).filter(Boolean) as event[]} label="Export Upcoming" />
          )}
        </div>

        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 h-11 w-full justify-start overflow-x-auto">
            <TabsTrigger value="upcoming" className="rounded-sm px-4">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="normal" className="rounded-sm px-4">Normal ({normal.length})</TabsTrigger>
            <TabsTrigger value="merchandise" className="rounded-sm px-4">Merchandise ({merchandise.length})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-sm px-4">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-sm px-4">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <RegistrationGrid loading={loading} registrations={upcoming} emptyMessage="No upcoming registrations" />
          </TabsContent>

          <TabsContent value="normal">
             <RegistrationGrid loading={loading} registrations={normal} emptyMessage="No normal events registered" />
          </TabsContent>
          
          <TabsContent value="merchandise">
             <RegistrationGrid loading={loading} registrations={merchandise} emptyMessage="No merchandise purchased" />
          </TabsContent>

          <TabsContent value="completed">
            <RegistrationGrid loading={loading} registrations={completed} emptyMessage="No completed events yet" showStatus={false} />
          </TabsContent>

          <TabsContent value="cancelled">
            <RegistrationGrid loading={loading} registrations={cancelled} emptyMessage="No cancelled registrations" isCancelled />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

function RegistrationGrid({ 
  loading, 
  registrations, 
  emptyMessage, 
  showStatus = true,
  isCancelled = false 
}: { 
  loading: boolean, 
  registrations: registration[], 
  emptyMessage: string,
  showStatus?: boolean,
  isCancelled?: boolean
}) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="h-full border-muted/60 shadow-none">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {!isCancelled && (
          <Link href="/events" className="text-sm underline underline-offset-4 mt-2 inline-block">
            Browse Events
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {registrations.map(reg => (
        <RegistrationCard key={reg.ticketid} registration={reg} showStatus={showStatus} isCancelled={isCancelled} />
      ))}
    </div>
  )
}

function RegistrationCard({ 
  registration: reg, 
  showStatus,
  isCancelled 
}: { 
  registration: registration, 
  showStatus: boolean,
  isCancelled: boolean 
}) {
  const ev = typeof reg.event === 'object' ? reg.event : null
  
  return (
    <Link href={`/registrations/${reg.ticketid}`}>
      <Card className={`h-full cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm flex flex-col group border-muted/60 bg-card/50 backdrop-blur-sm ${isCancelled ? 'opacity-70' : ''}`}>
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
              {ev?.name || 'Event'}
            </CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={ev?.type === 'Merchandise' ? 'secondary' : 'outline'} className="font-normal uppercase text-[10px] tracking-wider">
                {ev?.type || 'Event'}
              </Badge>
              {!isCancelled && ev && (
                <ExportCalendarButton events={ev} size="icon" variant="ghost" />
              )}
            </div>
          </div>
          <CardDescription>Ticket: {reg.ticketid}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 mt-auto">
          {showStatus && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={isCancelled ? "destructive" : "outline"}>{isCancelled ? 'Cancelled' : reg.status}</Badge>
            </div>
          )}
          {ev?.dates?.start && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span>{new Date(ev.dates.start).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
