'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import type { registration, event } from '@/lib/types'

export default function DashboardPage() {
  const { data, loading } = usefetch<{ registrations: registration[] }>('/api/registrations/me')

  const upcoming = data?.registrations?.filter(r => r.status === 'Registered' || r.status === 'Confirmed' || r.status === 'Pending') || []
  const completed = data?.registrations?.filter(r => {
    if (typeof r.event === 'object') {
      return r.event.status === 'completed'
    }
    return false
  }) || []
  const cancelled = data?.registrations?.filter(r => r.status === 'Cancelled') || []

  const getev = (reg: registration): event | null => typeof reg.event === 'object' ? reg.event : null

  return (
    <AppLayout roles={['Participant']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Your events and registrations</p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 h-11">
            <TabsTrigger value="upcoming" className="rounded-sm px-6">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-sm px-6">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-sm px-6">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
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
            ) : upcoming.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(reg => {
                  const ev = getev(reg)
                  return (
                    <Link key={reg.ticketid} href={`/registrations/${reg.ticketid}`}>
                      <Card className="h-full cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm flex flex-col group border-muted/60 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                              {ev?.name || 'Event'}
                            </CardTitle>
                            <Badge variant={ev?.type === 'Merchandise' ? 'secondary' : 'outline'} className="font-normal uppercase text-[10px] tracking-wider">
                              {ev?.type || 'Event'}
                            </Badge>
                          </div>
                          <CardDescription>Ticket: {reg.ticketid}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 mt-auto">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline">{reg.status}</Badge>
                          </div>
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
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No upcoming registrations</p>
                <Link href="/events" className="text-sm underline underline-offset-4 mt-2 inline-block">
                  Browse Events
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completed.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completed.map(reg => {
                  const ev = getev(reg)
                  return (
                    <Card key={reg.ticketid} className="h-full border-muted/60 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold tracking-tight">{ev?.name || 'Event'}</CardTitle>
                        <CardDescription>{reg.ticketid}</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <Badge variant="outline">Completed</Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No completed events yet</p>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelled.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cancelled.map(reg => {
                  const ev = getev(reg)
                  return (
                    <Card key={reg.ticketid} className="h-full border-muted/60 bg-card/50 backdrop-blur-sm opacity-70">
                      <CardHeader>
                         <CardTitle className="text-lg font-semibold tracking-tight">{ev?.name || 'Event'}</CardTitle>
                        <CardDescription>{reg.ticketid}</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <Badge variant="destructive">Cancelled</Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No cancelled registrations</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
