'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layouts/applayout'
import { usefetch } from '@/lib/hooks/usefetch'
import { useauth } from '@/lib/authcontext'
import { apicall } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { X, Check, Pencil, Lock, Eye, EyeOff } from 'lucide-react'
import type { user, organizer } from '@/lib/types'

const INTERESTS = [
  'Technology', 'Music', 'Art', 'Sports', 'Gaming',
  'Photography', 'Dance', 'Literature', 'Science', 'Business',
  'Design', 'Film', 'Robotics', 'Quiz', 'Dramatics',
]

function getFollowingIds(profile: user | null): string[] {
  if (!profile?.following) return []
  return profile.following.map(f => typeof f === 'string' ? f : f._id)
}

export default function ProfilePage() {
  const { token } = useauth()
  const { data: profile, loading, refetch } = usefetch<user>('/api/users/me')
  const { data: orgs } = usefetch<organizer[]>('/api/organizers')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    college: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        contact: profile.contact || '',
        college: profile.college || '',
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apicall('/api/users/me', { method: 'PATCH', body: form, token })
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
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        contact: profile.contact || '',
        college: profile.college || '',
      })
    }
    setEditing(false)
    setError('')
  }

  const toggleInterest = async (interest: string) => {
    const current = profile?.interests || []
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest]
    try {
      await apicall('/api/users/me', { method: 'PATCH', body: { interests: updated }, token })
      refetch()
    } catch {}
  }

  const handleUnfollow = async (orgId: string) => {
    try {
      await apicall(`/api/organizers/${orgId}/follow`, { method: 'POST', token })
      refetch()
    } catch {}
  }

  const followingIds = getFollowingIds(profile)
  const followedOrgs = orgs?.filter(o => followingIds.includes(o._id)) || []

  if (loading) {
    return (
      <AppLayout roles={['Participant']}>
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

  const selectedInterests = profile?.interests || []

  return (
    <AppLayout roles={['Participant']}>
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
        {success && <div className="bg-green-300/10 text-green-600 dark:text-green-300 px-4 py-3 rounded-md text-sm">{success}</div>}

        <Card className="border-muted/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                {editing ? (
                  <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                ) : (
                  <p className="text-sm py-2">{profile?.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                {editing ? (
                  <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                ) : (
                  <p className="text-sm py-2">{profile?.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm py-2 text-muted-foreground">{profile?.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Participant Type</label>
              <div className="py-1">
                <Badge variant="secondary">{profile?.type || 'N/A'}</Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
              {editing ? (
                <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
              ) : (
                <p className="text-sm py-2">{profile?.contact || '—'}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">College / Organization</label>
              {editing ? (
                <Input 
                  value={form.college} 
                  onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                  disabled={profile?.type === 'IIIT'}
                  className={profile?.type === 'IIIT' ? 'opacity-70 cursor-not-allowed' : ''}
                />
              ) : (
                <p className="text-sm py-2">{profile?.college || '—'}</p>
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

        <Card className="border-muted/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => {
                const selected = selectedInterests.includes(interest)
                return (
                  <Badge
                    key={interest}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                    {selected && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Followed Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            {followedOrgs.length > 0 ? (
              <div className="space-y-2">
                {followedOrgs.map(org => (
                  <div key={org._id} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.category}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleUnfollow(org._id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not following any clubs</p>
            )}
          </CardContent>
        </Card>

        <Separator />

        <ChangePassword />
      </div>
    </AppLayout>
  )
}

function ChangePassword() {
  const { token } = useauth()
  const [show, setShow] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ current: '', newpass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (form.newpass !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.newpass.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      await apicall('/api/users/me/password', {
        method: 'PUT',
        body: { current: form.current, newpass: form.newpass },
        token,
      })
      setSuccess('Password changed')
      setForm({ current: '', newpass: '', confirm: '' })
      setShow(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-muted/60 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </CardTitle>
          {!show && (
            <Button variant="outline" size="sm" onClick={() => setShow(true)}>Change Password</Button>
          )}
        </div>
      </CardHeader>
      {show && (
        <CardContent className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
          {success && <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm">{success}</div>}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={form.current}
                onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={form.newpass}
                onChange={e => setForm(f => ({ ...f, newpass: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={saving} size="sm">
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShow(false); setError(''); setSuccess('') }}>
              Cancel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
