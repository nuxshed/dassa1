'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import type { event } from '@/lib/types'
import { useState } from 'react'
import { Calendar, MapPin, CircleUser } from 'lucide-react'

export default function EventsPage() {
  const { data, loading, error } = usefetch<{ events: event[] } | event[]>('/api/events')
  const events = Array.isArray(data) ? data : (data?.events || [])
  const [filter, setFilter] = useState<string>('all')

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true
    return e.type === filter
  })

  const publishedEvents = filteredEvents.filter(e => e.status === 'published' || e.status === 'ongoing')

  return (
    <AppLayout roles={['Participant']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <Tabs defaultValue="all" onValueChange={setFilter} className="space-y-8">
          <TabsList className="bg-muted/50 p-1 h-11">
            <TabsTrigger value="all" className="rounded-sm px-6">All Events</TabsTrigger>
            <TabsTrigger value="Normal" className="rounded-sm px-6">Regular</TabsTrigger>
            <TabsTrigger value="Merchandise" className="rounded-sm px-6">Merchandise</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-full border-muted/60 shadow-none">
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : publishedEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publishedEvents.map(ev => (
                <EventCard key={ev._id} event={ev} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
              <div className="rounded-full bg-muted/30 p-4 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium">No events found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                There are no events matching your criteria at the moment.
              </p>
              <Button variant="outline" onClick={() => setFilter('all')} className="mt-6">
                Clear Filters
              </Button>
            </div>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}

function EventCard({ event: ev }: { event: event }) {
  return (
    <Link href={`/events/${ev._id}`}>
      <Card className="h-full cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm flex flex-col group border-muted/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge 
              variant={ev.type === 'Merchandise' ? 'secondary' : 'outline'} 
              className="font-normal uppercase text-[10px] tracking-wider"
            >
              {ev.type}
            </Badge>
            {ev.limit && ev.regcount && ev.regcount >= ev.limit && (
               <Badge variant="destructive" className="font-normal text-[10px]">Full</Badge>
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
              {ev.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
              {ev.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-auto pt-0">
          <div className="flex flex-col gap-2.5 text-sm text-muted-foreground pt-4 border-t border-border/50">
            {ev.dates?.start && (
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 opacity-70" />
                <span className="font-medium">{new Date(ev.dates.start).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <CircleUser className="h-4 w-4 opacity-70" />
              <span>{typeof ev.organizer === 'object' ? ev.organizer.name : 'Unknown Organizer'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
