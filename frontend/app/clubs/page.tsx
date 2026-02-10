'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { organizer } from '@/lib/types'
import { Users, Mail } from 'lucide-react'

export default function ClubsPage() {
  const { data, loading, error } = usefetch<organizer[]>('/api/organizers')
  const clubs = data || []

  return (
    <AppLayout roles={['Participant']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Clubs</h1>
            <p className="text-muted-foreground text-lg">Discover and follow student organizations.</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-full border-muted/60 shadow-none">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : clubs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map(club => (
              <ClubCard key={club._id} club={club} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
            <div className="rounded-full bg-muted/30 p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No clubs found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              It seems there are no registered clubs yet.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ClubCard({ club }: { club: organizer }) {
  const initials = club.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Card className="h-full transition-all hover:border-foreground/10 hover:shadow-sm flex flex-col border-muted/60 bg-card/50 backdrop-blur-sm group">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <Avatar className="h-14 w-14 border border-border shadow-sm group-hover:border-primary/20 transition-colors">
          <AvatarFallback className="bg-primary/5 text-primary font-semibold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <CardTitle className="text-lg font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
            {club.name}
          </CardTitle>
          <Badge variant="secondary" className="w-fit font-normal text-[10px] uppercase tracking-wider mt-1.5 opacity-80">
            {club.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="mt-auto pt-0 text-sm">
        <p className="text-muted-foreground line-clamp-3 leading-relaxed mb-4 min-h-[4.5rem]">
          {club.description || 'No description available for this club.'}
        </p>
        
        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-muted-foreground text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 opacity-70" />
            <span>{club.followers || 0} followers</span>
          </div>
          {/* TODO: contact/website?? */}
        </div>
      </CardContent>
    </Card>
  )
}
