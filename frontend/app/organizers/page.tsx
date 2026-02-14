'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { organizer } from '@/lib/types'

export default function OrganizersPage() {
  const { data: organizers, loading, error } = usefetch<organizer[]>('/api/organizers')

  if (loading) {
    return <OrganizersSkeleton />
  }

  if (error || !organizers) {
    return (
      <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
        <div className="max-w-6xl mx-auto px-8 md:px-12 py-8">
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="bg-destructive/10 p-4 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Failed to load organizers</h1>
            <p className="text-muted-foreground">{error || "Something went wrong."}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-5xl mx-auto px-8 md:px-12 py-8">
        <div className="space-y-6">
          <div className="flex items-baseline justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">Clubs & Organizers</h1>
            <span className="text-xs text-muted-foreground">{organizers.length} total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {organizers.map(organizer => (
              <OrganizerCard key={organizer._id} organizer={organizer} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function OrganizerCard({ organizer }: { organizer: organizer }) {
  return (
    <Link href={`/organizers/${organizer._id}`} className="block">
      <div className="p-4 rounded-md border hover:bg-muted/50 transition-colors">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="text-xs">{organizer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium truncate">{organizer.name}</h3>
                <Badge variant="outline" className="font-normal text-xs flex-shrink-0">{organizer.category}</Badge>
              </div>
              {organizer.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {organizer.description}
                </p>
              )}
            </div>
            
            {organizer.followers !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{organizer.followers}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function OrganizersSkeleton() {
  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-5xl mx-auto px-8 md:px-12 py-8">
        <div className="space-y-6">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-3 w-16" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-md border">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
