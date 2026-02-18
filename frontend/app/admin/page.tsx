'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { organizer } from '@/lib/types'
import { Users, Plus, Calendar, KeyRound } from 'lucide-react'

export default function AdminDashboard() {
  const { data, loading } = usefetch<organizer[]>('/api/admin/organizers')
  const organizers = data || []

  const { data: events, loading: eventsLoading } = usefetch<any[]>('/api/events?limit=1000')
  const { data: requests, loading: requestsLoading } = usefetch<any[]>('/api/admin/requests')

  return (
    <AppLayout roles={['Admin']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <Link href="/admin/clubs/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Club
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/admin/clubs">
            <Card className="border-muted/60 shadow-none cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clubs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{organizers.length}</div>
                )}
              </CardContent>
            </Card>
          </Link>

          <Card className="border-muted/60 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{events?.length ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Link href="/admin/requests">
            <Card className="border-muted/60 shadow-none cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{requests?.length ?? 0}</div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Clubs</h2>
            <Link href="/admin/clubs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              View All
            </Link>
          </div>

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
          ) : organizers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {organizers.slice(0, 6).map(org => (
                <Link key={org._id} href={`/admin/clubs/${org._id}`}>
                  <Card className="h-full cursor-pointer hover:border-foreground/10 transition-all hover:shadow-sm flex flex-col group border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                          {org.name}
                        </CardTitle>
                        <Badge variant="outline" className="font-normal uppercase text-[10px] tracking-wider">
                          {org.category}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                        {org.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg border-dashed">
              <p className="text-muted-foreground mb-4">No clubs yet</p>
              <Link href="/admin/clubs">
                <Button variant="outline">Add First Club</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
