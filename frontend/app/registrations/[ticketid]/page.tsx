'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { useauth } from '@/lib/authcontext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { AlertCircle, ArrowLeft, Upload, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ExportCalendarButton } from '@/components/export-calendar-button'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

type TicketData = {
  _id: string
  ticketid: string
  status: 'Registered' | 'Pending' | 'Purchased' | 'Rejected' | 'Cancelled'
  checkin: boolean
  formdata?: any[]
  payment?: {
    proof: string
    uploadedat: string
  }
  event: {
    _id: string
    name: string
    type: 'Normal' | 'Merchandise'
    dates: { start: string; end: string; deadline: string }
  }
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

export default function TicketPage() {
  const params = useParams()
  const ticketid = Array.isArray(params?.ticketid) ? params.ticketid[0] : params?.ticketid
  const router = useRouter()
  const { token } = useauth()

  const { data: ticket, loading, error, refetch } = usefetch<TicketData>(`/api/registrations/${ticketid}`)

  const [qrUrl, setQrUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ticketid) {
      QRCode.toDataURL(ticketid, { width: 200, margin: 2 }).then(setQrUrl).catch(() => {})
    }
  }, [ticketid])

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Failed to upload file')
      const { url } = await uploadRes.json()

      const proofRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/registrations/${ticketid}/payment/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ proofUrl: url }),
      })

      if (!proofRes.ok) {
        const data = await proofRes.json()
        throw new Error(data.message || 'Failed to submit proof')
      }

      toast.success('Payment proof uploaded')
      refetch()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return <TicketSkeleton />

  if (error || !ticket) {
    return (
      <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Ticket not found</h1>
          <p className="text-muted-foreground">{error || 'This ticket does not exist.'}</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </AppLayout>
    )
  }

  const ev = ticket.event
  const isMerch = ev.type === 'Merchandise'
  const canUploadProof = isMerch && ['Registered', 'Rejected'].includes(ticket.status)
  const showQr = ticket.status === 'Registered' || ticket.status === 'Purchased'

  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">{ev.type}</Badge>
              <StatusBadge status={ticket.status} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{ev.name}</h1>
          </div>
          <ExportCalendarButton events={ev as any} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-6">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ticket ID</span>
                  <span className="font-mono font-medium">{ticket.ticketid}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span>{ticket.user.firstName} {ticket.user.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-xs">{ticket.user.email}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event Date</span>
                  <span>{new Date(ev.dates.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Registered</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {ticket.checkin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Checked In</span>
                    <Badge variant="outline" className="text-xs">Yes</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {ticket.formdata && ticket.formdata.length > 0 && (
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Registration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ticket.formdata.map((field: any, i: number) => {
                    const isUrl = typeof field.value === 'string' && field.value.startsWith('http');
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{field.label || field.name}</span>
                        {isUrl ? (
                          <a href={field.value} target="_blank" rel="noreferrer" className="text-primary hover:underline">View File</a>
                        ) : (
                          <span>{field.value}</span>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {isMerch && (
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticket.status === 'Pending' && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                      <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">Payment proof submitted. Awaiting organizer approval.</p>
                    </div>
                  )}

                  {ticket.status === 'Purchased' && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-green-700 dark:text-green-300">Payment approved.</p>
                    </div>
                  )}

                  {ticket.status === 'Rejected' && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-sm text-destructive">Payment was rejected. Please upload a new proof.</p>
                    </div>
                  )}

                  {ticket.payment?.proof && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Payment Proof</p>
                      <ProofViewer url={ticket.payment.proof} token={token} />
                      {ticket.payment.uploadedat && (
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(ticket.payment.uploadedat).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {canUploadProof && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {ticket.status === 'Rejected' ? 'Re-upload payment proof' : 'Upload payment proof'}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          ref={fileRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleUploadProof}
                          disabled={uploading}
                          className="text-sm"
                        />
                        {uploading && <Loader2 className="h-4 w-4 animate-spin mt-2.5" />}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {showQr && qrUrl && (
            <div className="flex flex-col items-center">
              <Card className="bg-muted/20">
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <img src={qrUrl} alt="QR Code" className="rounded-md" width={180} height={180} />
                  <p className="text-xs text-muted-foreground text-center font-mono">{ticket.ticketid}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function ProofViewer({ url, token }: { url: string; token: string | null }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleView = async () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setBlobUrl(objectUrl)
      window.open(objectUrl, '_blank')
    } catch {
      toast.error('Failed to load proof')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleView}
      disabled={loading}
      className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground inline-flex items-center gap-1"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      View uploaded proof
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Registered':
      return <Badge variant="outline">Registered</Badge>
    case 'Pending':
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
    case 'Purchased':
      return <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-300/20">Confirmed</Badge>
    case 'Rejected':
      return <Badge variant="destructive">Rejected</Badge>
    case 'Cancelled':
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function TicketSkeleton() {
  return (
    <AppLayout roles={['Participant', 'Organizer', 'Admin']}>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-6">
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
    </AppLayout>
  )
}
