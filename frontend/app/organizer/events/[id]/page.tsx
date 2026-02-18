'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { usemutation } from '@/lib/hooks/usemutation'
import { useauth } from '@/lib/authcontext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { AlertCircle, ArrowLeft, CalendarIcon, Loader2, Users, Pencil, X, Check, Download, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { event } from '@/lib/types'
import { toast } from 'sonner'
import { useState } from 'react'
import { format } from 'date-fns'

type participant = {
  ticketid: string
  user: { _id: string; email: string; firstName?: string; lastName?: string }
  formdata?: Record<string, any>
  checkin?: boolean
  registeredat: string
  status: string
}

export default function OrganizerEventPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()
  const { token } = useauth()

  const { data: ev, loading, error, refetch } = usefetch<event>(`/api/events/${id}`)
  const { data: regData, loading: regLoading, refetch: refetchRegs } = usefetch<{ total: number; participants: participant[] }>(`/api/events/${id}/registrations`)

  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [limit, setLimit] = useState('')
  const [status, setStatus] = useState('')
  const [deadlineDate, setDeadlineDate] = useState<Date>()
  const [deadlineTime, setDeadlineTime] = useState('09:00')
  const [fee, setFee] = useState('')
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEditing = () => {
    if (!ev) return
    setDescription(ev.description)
    setLimit(String(ev.limit || ''))
    setFee(String(ev.fee ?? ''))
    setStatus(ev.status)
    const dl = new Date(ev.dates.deadline)
    setDeadlineDate(dl)
    setDeadlineTime(format(dl, 'HH:mm'))
    setEditing(true)
  }

  const cancelEditing = () => setEditing(false)

  const saveChanges = async () => {
    if (!ev) return
    setSaving(true)
    try {
      const deadline = deadlineDate ? new Date(deadlineDate) : undefined
      if (deadline && deadlineTime) {
        const [h, m] = deadlineTime.split(':')
        deadline.setHours(parseInt(h), parseInt(m))
      }

      const body: any = {}
      if (description !== ev.description) body.description = description
      if (Number(limit) !== (ev.limit || 0)) body.limit = Number(limit)
      if (fee !== '' && Number(fee) !== (ev.fee ?? 0)) body.fee = Number(fee)
      if (status !== ev.status) body.status = status
      if (deadline && deadline.getTime() !== new Date(ev.dates.deadline).getTime()) {
        body.dates = { deadline }
      }

      if (Object.keys(body).length === 0) {
        setEditing(false)
        setSaving(false)
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update')
      }

      toast.success('Event updated')
      setEditing(false)
      refetch()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/${id}/registrations/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-${id}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export registrations')
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'published' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to publish')
      }
      toast.success('Event published')
      refetch()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    setSaving(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to delete')
      }
      toast.success('Event deleted')
      router.push('/organizer')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <EventSkeleton />

  if (error || !ev) {
    return (
      <AppLayout roles={['Organizer']}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">{error || "This event doesn't exist or you don't have access."}</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </AppLayout>
    )
  }

  const participants = regData?.participants || []

  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-7xl mx-auto px-8 md:px-12 py-8">
        <Link href="/organizer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-normal">{ev.type}</Badge>
              <Badge variant={ev.status === 'published' ? 'default' : 'secondary'} className="capitalize">{ev.status}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{ev.name}</h1>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
                {ev.status === 'draft' && (
                  <Button size="sm" onClick={handlePublish} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                    Publish
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleDelete} disabled={saving} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-6">
            {editing ? (
              <EditForm
                description={description}
                setDescription={setDescription}
                limit={limit}
                setLimit={setLimit}
                fee={fee}
                setFee={setFee}
                status={status}
                setStatus={setStatus}
                deadlineDate={deadlineDate}
                setDeadlineDate={setDeadlineDate}
                deadlineTime={deadlineTime}
                setDeadlineTime={setDeadlineTime}
                deadlineOpen={deadlineOpen}
                setDeadlineOpen={setDeadlineOpen}
                currentStatus={ev.status}
                eventType={ev.type}
              />
            ) : (
              <EventDetails event={ev} />
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Registrations ({regData?.total || 0})</h2>
                {participants.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleExport}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Export
                  </Button>
                )}
              </div>

              {regLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : participants.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {participants.map(p => (
                    <div key={p.ticketid} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.user.firstName ? `${p.user.firstName} ${p.user.lastName || ''}`.trim() : p.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{p.ticketid}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.checkin && <Badge variant="outline" className="text-xs">Checked in</Badge>}
                        <Badge variant="secondary" className="text-xs capitalize">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border rounded-md border-dashed">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No registrations yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="sticky top-8 space-y-4">
              <StatsCard event={ev} total={regData?.total || 0} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function EventDetails({ event: ev }: { event: event }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="text-sm font-medium">{new Date(ev.dates.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Time</p>
          <p className="text-sm font-medium">{new Date(ev.dates.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Deadline</p>
          <p className="text-sm font-medium">{new Date(ev.dates.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-medium mb-3">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ev.description}</p>
        </div>
        {ev.tags && ev.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {ev.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="font-normal text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function EditForm({
  description, setDescription,
  limit, setLimit,
  fee, setFee,
  status, setStatus,
  deadlineDate, setDeadlineDate,
  deadlineTime, setDeadlineTime,
  deadlineOpen, setDeadlineOpen,
  currentStatus,
  eventType,
}: {
  description: string; setDescription: (v: string) => void
  limit: string; setLimit: (v: string) => void
  fee: string; setFee: (v: string) => void
  status: string; setStatus: (v: string) => void
  deadlineDate?: Date; setDeadlineDate: (v: Date | undefined) => void
  deadlineTime: string; setDeadlineTime: (v: string) => void
  deadlineOpen: boolean; setDeadlineOpen: (v: boolean) => void
  currentStatus: string
  eventType: string
}) {
  const statusOptions = ['draft', 'published', 'ongoing', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Registration Limit</FieldLabel>
            <Input
              type="number"
              min="1"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />
          </Field>

          {eventType === 'Normal' && (
            <Field>
              <FieldLabel>Fee (₹)</FieldLabel>
              <Input
                type="number"
                min="0"
                value={fee}
                onChange={e => setFee(e.target.value)}
              />
            </Field>
          )}

          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex gap-4">
          <Field className="w-56">
            <FieldLabel>Deadline Date</FieldLabel>
            <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {deadlineDate ? format(deadlineDate, 'PPP') : 'Select date'}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={d => { setDeadlineDate(d); setDeadlineOpen(false) }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </Field>
          <Field className="w-32">
            <FieldLabel>Time</FieldLabel>
            <Input
              type="time"
              value={deadlineTime}
              onChange={e => setDeadlineTime(e.target.value)}
            />
          </Field>
        </div>
      </FieldGroup>
    </div>
  )
}

function StatsCard({ event: ev, total }: { event: event; total: number }) {
  const limit = ev.limit || 0
  const pct = limit ? Math.min(100, (total / limit) * 100) : 0

  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Registrations</span>
            <span className="font-medium">{total} / {limit || '∞'}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={ev.status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs">{ev.status}</Badge>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">{ev.type}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Eligibility</span>
            <span className="font-medium capitalize">{ev.eligibility}</span>
          </div>
          {ev.fee !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fee</span>
              <span className="font-medium">{ev.fee ? `₹${ev.fee}` : 'Free'}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Start</span>
            <span className="font-medium">{new Date(ev.dates.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">End</span>
            <span className="font-medium">{new Date(ev.dates.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Deadline</span>
            <span className="font-medium">{new Date(ev.dates.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EventSkeleton() {
  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-6xl mx-auto px-8 md:px-12 py-8">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-2/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    </AppLayout>
  )
}
