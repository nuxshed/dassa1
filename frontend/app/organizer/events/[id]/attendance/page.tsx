'use client'

import { AppLayout } from '@/components/layouts/applayout'
import { useauth } from '@/lib/authcontext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Camera, Upload, CheckCircle2, XCircle, AlertTriangle, Download, UserCheck, Users, Loader2, ScanLine } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'
import { usefetch } from '@/lib/hooks/usefetch'

type attendanceuser = {
  _id: string
  firstName?: string
  lastName?: string
  email: string
}

type attendanceparticipant = {
  ticketid: string
  user: attendanceuser
  checkin: boolean
  checkinat?: string
  status: string
}

type statsdata = {
  total: number
  checkedin: number
  participants: attendanceparticipant[]
}

type scanresult = {
  type: 'success' | 'error' | 'duplicate'
  message: string
  user?: attendanceuser
}

export default function AttendancePage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()
  const { token } = useauth()

  const { data: stats, loading, refetch } = usefetch<statsdata>(`/api/events/${id}/attendance/stats`)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<scanresult | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTicket, setManualTicket] = useState('')
  const [manualReason, setManualReason] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  const apiurl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const processTicket = useCallback(async (ticketid: string) => {
    setScanLoading(true)
    setScanResult(null)
    try {
      const res = await fetch(`${apiurl}/api/events/${id}/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketid: ticketid.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setScanResult({ type: 'success', message: data.message, user: data.user })
        toast.success(`${data.user?.firstName || 'Participant'} checked in`)
        refetch()
      } else if (res.status === 409) {
        setScanResult({ type: 'duplicate', message: data.message, user: data.user })
      } else {
        setScanResult({ type: 'error', message: data.message })
      }
    } catch {
      setScanResult({ type: 'error', message: 'network error' })
    } finally {
      setScanLoading(false)
    }
  }, [apiurl, id, token, refetch])

  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      setScanning(true)
      setScanResult(null)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => {
          await scanner.stop()
          setScanning(false)
          processTicket(text)
        },
        () => {}
      )
    } catch {
      setScanning(false)
      toast.error('Could not access camera')
    }
  }, [processTicket])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const scanner = new Html5Qrcode('qr-file-reader')
      const result = await scanner.scanFile(file, true)
      await scanner.clear()
      processTicket(result)
    } catch {
      setScanResult({ type: 'error', message: 'could not read QR code from image' })
    }
    e.target.value = ''
  }

  const handleManualCheckin = async () => {
    if (!manualTicket.trim() || !manualReason.trim()) return
    setManualLoading(true)
    try {
      const res = await fetch(`${apiurl}/api/events/${id}/attendance/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketid: manualTicket.trim(), reason: manualReason.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setManualOpen(false)
        setManualTicket('')
        setManualReason('')
        refetch()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setManualLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${apiurl}/api/events/${id}/attendance/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${id}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export attendance')
    }
  }

  const participants = stats?.participants || []
  const checkedin = participants.filter(p => p.checkin)
  const notcheckedin = participants.filter(p => !p.checkin)
  const total = stats?.total || 0
  const checkedinCount = stats?.checkedin || 0
  const pct = total > 0 ? Math.round((checkedinCount / total) * 100) : 0

  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-5xl mx-auto px-8 md:px-12 py-8 space-y-8">
        <div>
          <Link href={`/organizer/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Link>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
              <p className="text-sm text-muted-foreground">Scan QR codes to check in participants</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setManualOpen(true)}>
                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                Manual
              </Button>
              {participants.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-muted/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Registered</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{checkedinCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Checked In</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{total - checkedinCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Not Yet Scanned</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Attendance Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-600 dark:bg-green-400 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-medium">QR Scanner</h2>
            <Card className="bg-muted/20 overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div id="qr-reader" ref={scannerContainerRef} className={scanning ? 'rounded-md overflow-hidden' : 'hidden'} />
                <div id="qr-file-reader" className="hidden" />

                {!scanning && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4 border border-dashed rounded-md">
                    <ScanLine className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Start camera or upload QR image</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {scanning ? (
                    <Button variant="outline" className="flex-1" onClick={stopScanner}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Stop Camera
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={startScanner}>
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Start Camera
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </Button>
                </div>

                {scanLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                )}

                {scanResult && (
                  <div className={`flex items-start gap-3 p-3 rounded-md text-sm ${
                    scanResult.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                    scanResult.type === 'duplicate' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {scanResult.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> :
                     scanResult.type === 'duplicate' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> :
                     <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium">{scanResult.message}</p>
                      {scanResult.user && (
                        <p className="text-xs mt-0.5 opacity-80">
                          {scanResult.user.firstName} {scanResult.user.lastName} — {scanResult.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Participants ({total})</h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : participants.length > 0 ? (
              <div className="border rounded-md overflow-hidden max-h-[520px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Participant</TableHead>
                      <TableHead className="text-xs">Ticket</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...checkedin, ...notcheckedin].map(p => (
                      <TableRow key={p.ticketid}>
                        <TableCell className="text-sm">
                          {p.user.firstName ? `${p.user.firstName} ${p.user.lastName || ''}`.trim() : p.user.email}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{p.ticketid}</TableCell>
                        <TableCell className="text-right">
                          {p.checkin ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                              Checked In
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border rounded-md border-dashed">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No registrations</p>
              </div>
            )}
          </div>
        </div>

        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Check-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ticket ID</label>
                <Input
                  placeholder="Enter ticket ID"
                  value={manualTicket}
                  onChange={e => setManualTicket(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Input
                  placeholder="Reason for manual check-in"
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
              <Button onClick={handleManualCheckin} disabled={manualLoading || !manualTicket.trim() || !manualReason.trim()}>
                {manualLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 mr-1.5" />}
                Check In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
