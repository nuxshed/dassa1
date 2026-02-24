'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { useauth } from '@/lib/authcontext'
import { apicall } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Pencil } from 'lucide-react'
import type { organizer } from '@/lib/types'

export default function OrganizerProfilePage() {
  const { token } = useauth()
  const { data: profile, loading, refetch } = usefetch<organizer>('/api/organizers/me')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contact: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        category: profile.category || '',
        description: profile.description || '',
        contactEmail: profile.contactEmail || '',
        contact: profile.contact || '',
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apicall('/api/organizers/me', { method: 'PATCH', body: form, token })
      setSuccess('Profile updated')
      setEditing(false)
      refetch()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        category: profile.category || '',
        description: profile.description || '',
        contactEmail: profile.contactEmail || '',
        contact: profile.contact || '',
      })
    }
    setEditing(false)
    setError('')
  }

  if (loading) {
    return (
      <AppLayout roles={['Organizer']}>
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          <Skeleton className="h-8 w-48" />
          <Card className="border-muted/60 shadow-none">
            <CardContent className="space-y-4 pt-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout roles={['Organizer']}>
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
        {success && <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm">{success}</div>}

        <Card className="border-muted/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              {editing ? (
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              ) : (
                <p className="text-sm py-2">{profile?.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              {editing ? (
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              ) : (
                <p className="text-sm py-2">{profile?.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              {editing ? (
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm py-2">{profile?.description || '—'}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Login Email</label>
              <p className="text-sm py-2 text-muted-foreground">{profile?.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
              {editing ? (
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="Public contact email"
                />
              ) : (
                <p className="text-sm py-2">{profile?.contactEmail || '—'}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
              {editing ? (
                <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
              ) : (
                <p className="text-sm py-2">{profile?.contact || '—'}</p>
              )}
            </div>

            {editing && (
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
