'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { useauth } from '@/lib/authcontext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import Link from 'next/link'
import type { event, user } from '@/lib/types'
import { useState, useMemo } from 'react'
import { Calendar, CircleUser, Search, X, CalendarDays, Flame } from 'lucide-react'


import Fuse from 'fuse.js'

export default function EventsPage() {
  const { token } = useauth()

  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [eligibility, setEligibility] = useState('all')
  const [clubFilter, setClubFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  // fetch everything once
  const { data, loading, error } = usefetch<{ events: event[] }>('/api/events?limit=200')
  const allEvents = data?.events || []

  const { data: profile } = usefetch<user>('/api/users/me', { skip: !token })
  const { data: trendingData } = usefetch<{ events: event[] }>('/api/events/trending')
  const trending = trendingData?.events || []

  // client-side filtering — instant
  const events = useMemo(() => {
    let filtered = allEvents

    if (search) {
      const fuse = new Fuse(allEvents, {
        keys: [
          'name',
          'organizer.name',
          'description',
          'type'
        ],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true
      })
      
      const terms = search.trim().split(/\s+/)
      const query = {
         $and: terms.map(term => ({
            $or: [
               { name: term },
               { 'organizer.name': term },
               { description: term },
               { type: term }
            ]
         }))
      }
      
      const results = fuse.search(query as any)
      filtered = results.map(r => r.item)
    }

    if (type !== 'all') {
      filtered = filtered.filter(ev => ev.type === type)
    }

    if (eligibility !== 'all') {
      filtered = filtered.filter(ev => ev.eligibility === eligibility)
    }

    if (dateFrom) {
      filtered = filtered.filter(ev => ev.dates?.start && new Date(ev.dates.start) >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(ev => ev.dates?.start && new Date(ev.dates.start) <= dateTo)
    }

    if (clubFilter === 'followed') {
      if (!profile?.following?.length) {
        filtered = []
      } else {
        const followingSet = new Set(profile.following.map(f => typeof f === 'object' && f !== null && '_id' in f ? (f as any)._id.toString() : f.toString()))
        filtered = filtered.filter(ev => {
          const orgId = typeof ev.organizer === 'object' && ev.organizer !== null && '_id' in ev.organizer ? (ev.organizer as any)._id.toString() : ev.organizer?.toString()
          return orgId && followingSet.has(orgId)
        })
      }
    }

    return filtered
  }, [allEvents, search, type, eligibility, dateFrom, dateTo, clubFilter, profile])

  const hasFilters = type !== 'all' || eligibility !== 'all' || dateFrom || dateTo || clubFilter !== 'all' || search

  const clearFilters = () => {
    setSearch('')
    setType('all')
    setEligibility('all')
    setDateFrom(undefined)
    setDateTo(undefined)
    setClubFilter('all')
  }

  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Browse Events</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        {trending.length > 0 && !hasFilters && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trending Now</h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible">
              {trending.map((ev, i) => (
                <Link key={ev._id} href={`/events/${ev._id}`} className="min-w-[200px] w-full flex-shrink-0 lg:min-w-0 hover:no-underline block h-full">
                  <div className="group h-full relative flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:bg-accent/50 hover:border-accent-foreground/10">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                         <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono shrink-0">
                            #{i + 1}
                         </Badge>
                         <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal shrink-0">
                            {ev.type === 'Merchandise' ? 'MERCH' : 'NORMAL'}
                         </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-semibold leading-tight line-clamp-2 text-sm group-hover:text-primary transition-colors">
                          {ev.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {typeof ev.organizer === 'object' ? ev.organizer.name : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* search + filters — single row on wide screens */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative lg:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events or organizers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Merchandise">Merch</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eligibility} onValueChange={setEligibility}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="iiit">IIIT Only</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-sm font-normal gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateFrom ? dateFrom.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-sm font-normal gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateTo ? dateTo.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>

            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                <SelectItem value="followed">Followed</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* results */}
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
        ) : events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(ev => (
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
              {hasFilters
                ? 'No events match your filters. Try adjusting your search or filters.'
                : 'There are no events available at the moment.'}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-6">
                Clear Filters
              </Button>
            )}
          </div>
        )}
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
              {ev.type === 'Merchandise' ? 'Merch' : ev.type}
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
