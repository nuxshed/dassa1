'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { event } from '@/lib/types'
import { Plus } from 'lucide-react'

export default function OrganizerDashboard() {
  const { data, loading, error } = usefetch<{ events: event[] } | event[]>('/api/events?limit=1000')

  const events = Array.isArray(data) ? data : (data?.events || [])

  console.log('[Organizer] Events data:', { 
    totalEvents: events.length, 
    events: events.map(e => ({ id: e._id, name: e.name, status: e.status }))
  })

  const drafts = events.filter(e => e.status === 'draft')
  const published = events.filter(e => e.status === 'published')
  const completed = events.filter(e => e.status === 'completed' || e.status === 'ongoing')
  
  console.log('[Organizer] Filtered counts:', {
    total: events.length,
    drafts: drafts.length,
    published: published.length,
    completed: completed.length,
    statusBreakdown: events.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  })

  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <Link href="/organizer/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 h-11">
            <TabsTrigger value="all" className="rounded-sm px-6">All Events ({events.length})</TabsTrigger>
            <TabsTrigger value="draft" className="rounded-sm px-6">Drafts ({drafts.length})</TabsTrigger>
            <TabsTrigger value="published" className="rounded-sm px-6">Published ({published.length})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-sm px-6">Completed ({completed.length})</TabsTrigger>
          </TabsList>

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
          ) : (
            <>
              <TabsContent value="all" className="space-y-4">
                {events.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map(ev => <EventCard key={ev._id} event={ev} />)}
                  </div>
                ) : <EmptyState />}
              </TabsContent>

              <TabsContent value="draft" className="space-y-4">
                {drafts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {drafts.map(ev => <EventCard key={ev._id} event={ev} />)}
                  </div>
                ) : <EmptyState message="No draft events" />}
              </TabsContent>

              <TabsContent value="published" className="space-y-4">
                {published.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {published.map(ev => <EventCard key={ev._id} event={ev} />)}
                  </div>
                ) : <EmptyState message="No published events" />}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completed.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {completed.map(ev => <EventCard key={ev._id} event={ev} />)}
                  </div>
                ) : <EmptyState message="No completed events" />}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}

function EmptyState({ message = "No events found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
      <div className="rounded-full bg-muted/30 p-4 mb-4">
        <Plus className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium">{message}</h3>
      <Link href="/organizer/create" className="mt-4">
        <Button variant="outline">Create Event</Button>
      </Link>
    </div>
  )
}

function EventCard({ event: ev }: { event: event }) {
  return (
    <Link href={`/organizer/events/${ev._id}`}>
      <Card className="h-full cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm flex flex-col group border-muted/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
              {ev.name}
            </CardTitle>
            <Badge variant={ev.type === 'Merchandise' ? 'secondary' : 'outline'} className="font-normal uppercase text-[10px] tracking-wider">
              {ev.type}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {ev.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
            <span className="text-muted-foreground">Registrations</span>
            <span className="font-medium">{ev.registrationCount || 0} / {ev.registrationLimit || '∞'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={ev.status === 'published' ? 'default' : 'secondary'} className="capitalize">
              {ev.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
