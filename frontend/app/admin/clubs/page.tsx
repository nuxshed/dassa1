'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Users, MoreVertical, Ban, Trash2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { apicall } from '@/lib/api'
import { useauth } from '@/lib/authcontext'
import type { organizer } from '@/lib/types'

export default function ClubsPage() {
  const { data, loading, refetch } = usefetch<organizer[]>('/api/admin/organizers')
  const { token } = useauth()
  const clubs = data || []

  const [confirm, setConfirm] = useState<{ club: organizer; action: 'remove' | 'toggle' } | null>(null)
  const [acting, setActing] = useState(false)

  const handleConfirm = async () => {
    if (!confirm) return
    setActing(true)
    try {
      if (confirm.action === 'remove') {
        await apicall(`/api/admin/organizers/${confirm.club._id}`, { method: 'DELETE', token })
      } else {
        await apicall(`/api/admin/organizers/${confirm.club._id}/toggle`, { method: 'PATCH', token })
      }
      refetch()
    } catch {}
    setActing(false)
    setConfirm(null)
  }

  return (
    <AppLayout roles={['Admin']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Clubs</h1>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-muted/60 shadow-none">
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
        ) : clubs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map(club => (
              <Card key={club._id} className={`border-muted/60 shadow-none ${club.disabled ? 'opacity-50' : ''}`}>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="text-lg font-semibold tracking-tight line-clamp-1">
                        {club.name}
                      </CardTitle>
                      {club.disabled && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">disabled</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="font-normal uppercase text-[10px] tracking-wider">
                        {club.category}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setConfirm({ club, action: 'toggle' })}>
                            {club.disabled ? (
                              <><ShieldCheck className="h-4 w-4 mr-2" />Enable</>
                            ) : (
                              <><Ban className="h-4 w-4 mr-2" />Disable</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirm({ club, action: 'remove' })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {club.email}
                  </CardDescription>
                </CardHeader>
                {club.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
            <div className="rounded-full bg-muted/30 p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No clubs yet</h3>
            <Link href="/admin/clubs/create" className="mt-4">
              <Button variant="outline">Add First Club</Button>
            </Link>
          </div>
        )}
      </div>

      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === 'remove' ? 'Remove' : confirm?.club.disabled ? 'Enable' : 'Disable'} {confirm?.club.name}?
            </DialogTitle>
            <DialogDescription>
              {confirm?.action === 'remove'
                ? 'This will permanently delete this club and all associated data.'
                : confirm?.club.disabled
                  ? 'This will re-enable the club account, allowing them to log in again.'
                  : 'This will prevent the club from logging in until re-enabled.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.action === 'remove' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={acting}
            >
              {acting ? 'processing...' : confirm?.action === 'remove' ? 'Remove' : confirm?.club.disabled ? 'Enable' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
