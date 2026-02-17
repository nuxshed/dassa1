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
import { KeyRound, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface resetdata {
  requestid?: string
  status: 'none' | 'pending' | 'approved' | 'rejected'
  createdat?: string
  reason?: string
  resolvedat?: string
  note?: string
}

export default function ResetPasswordPage() {
  const [reason, setReason] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { data, loading, refetch } = usefetch<resetdata>('/api/organizers/me/reset-request')

  const { mutate: submit, loading: submitting } = usemutation('/api/organizers/me/reset-request', {
    onsuccess: () => {
      setReason('')
      setShowForm(false)
      refetch()
    },
  })

  const handleSubmit = () => {
    submit({ reason: reason.trim() || undefined })
  }

  const statusConfig = {
    pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-500' },
    approved: { label: 'Approved', icon: CheckCircle2, variant: 'default' as const, color: 'text-green-500' },
    rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' as const, color: 'text-destructive' },
  }

  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground text-lg">Request a password reset from the admin</p>
        </div>

        {loading ? (
          <Card className="border-muted/60 shadow-none">
            <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : data && data.status !== 'none' && !showForm ? (
          <Card className="border-muted/60 shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Request</CardTitle>
                <Badge variant={statusConfig[data.status].variant} className="capitalize gap-1.5">
                  {(() => { const Icon = statusConfig[data.status].icon; return <Icon className="h-3 w-3" /> })()}
                  {statusConfig[data.status].label}
                </Badge>
              </div>
              {data.createdat && (
                <CardDescription>
                  Submitted on {new Date(data.createdat).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {data.reason && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="text-sm">{data.reason}</p>
                </div>
              )}
              {data.resolvedat && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Resolved on</p>
                  <p className="text-sm">{new Date(data.resolvedat).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}
              {data.note && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Admin Note</p>
                  <p className="text-sm">{data.note}</p>
                </div>
              )}
              {data.status !== 'pending' && (
                <div className="pt-2">
                  <Button onClick={() => setShowForm(true)} variant="outline" size="sm">Submit New Request</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-muted/60 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Request Password Reset</CardTitle>
                  <CardDescription>The admin will review your request and provide a new password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Textarea
                  placeholder="Why do you need a password reset?"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
