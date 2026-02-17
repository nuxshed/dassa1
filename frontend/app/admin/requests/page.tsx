'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { usemutation } from '@/lib/hooks/usemutation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KeyRound, CheckCircle2, XCircle, Copy, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface resetreq {
  _id: string
  organizer: { _id: string; name: string; email: string; category: string }
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  createdat: string
}

export default function AdminRequestsPage() {
  const { data: requests, loading, refetch } = usefetch<resetreq[]>('/api/admin/requests')
  const [selected, setSelected] = useState<resetreq | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [note, setNote] = useState('')
  const [newpass, setNewpass] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate: resolve, loading: resolving } = usemutation(
    `/api/admin/requests/${selected?._id}/resolve`,
    {
      onsuccess: (res) => {
        if (res.newpass) {
          setNewpass(res.newpass)
        } else {
          closeDialog()
          refetch()
        }
      },
    }
  )

  const openDialog = (req: resetreq, act: 'approve' | 'reject') => {
    setSelected(req)
    setAction(act)
    setNote('')
    setNewpass(null)
    setCopied(false)
  }

  const closeDialog = () => {
    setSelected(null)
    setAction(null)
    setNote('')
    setNewpass(null)
    setCopied(false)
  }

  const handleResolve = () => {
    if (!action) return
    resolve({ action, note: note.trim() || undefined })
  }

  const handleCopy = () => {
    if (newpass) {
      navigator.clipboard.writeText(newpass)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDone = () => {
    closeDialog()
    refetch()
  }

  return (
    <AppLayout roles={['Admin']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Password Reset Requests</h1>
          <p className="text-muted-foreground text-lg">Review and manage organizer password reset requests</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="border-muted/60 shadow-none">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map(req => (
              <Card key={req._id} className="border-muted/60 shadow-none">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">{req.organizer.name}</CardTitle>
                      <CardDescription>{req.organizer.email}</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-normal uppercase text-[10px] tracking-wider">
                      {req.organizer.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(req.createdat).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <Badge variant="secondary" className="capitalize">Pending</Badge>
                  </div>
                  {req.reason && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Reason</p>
                      <p className="text-sm">{req.reason}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => openDialog(req, 'approve')}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openDialog(req, 'reject')}>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
            <div className="rounded-full bg-muted/30 p-4 mb-4">
              <KeyRound className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No pending requests</h3>
            <p className="text-sm text-muted-foreground mt-1">All password reset requests have been handled</p>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) handleDone() }}>
        <DialogContent>
          {newpass ? (
            <>
              <DialogHeader>
                <DialogTitle>Password Reset Successful</DialogTitle>
                <DialogDescription>
                  New password for {selected?.organizer.name}. Share this with the organizer.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 font-mono text-sm">
                <span className="flex-1 select-all">{newpass}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleDone}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">{action} Request</DialogTitle>
                <DialogDescription>
                  {action === 'approve'
                    ? `This will generate a new password for ${selected?.organizer.name}.`
                    : `This will reject the request from ${selected?.organizer.name}.`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea
                  placeholder="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button
                  onClick={handleResolve}
                  disabled={resolving}
                  variant={action === 'reject' ? 'destructive' : 'default'}
                >
                  {resolving ? 'processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
