'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/applayout'
import { usemutation } from '@/lib/hooks/usemutation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function CreateClubPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [password, setPassword] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate: create, loading, error } = usemutation('/api/admin/organizers', {
    onsuccess: (res) => {
      setTempPassword(res.tempPassword)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    create({
      name: name.trim(),
      email: email.trim(),
      contact: contact.trim(),
      category: category.trim(),
      description: description.trim() || undefined,
      password: password.trim() || undefined,
    })
  }

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDone = () => {
    router.push('/admin/clubs')
  }

  if (tempPassword) {
    return (
      <AppLayout roles={['Admin']}>
        <div className="max-w-2xl mx-auto space-y-8 py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Club Created</h1>
            </div>
            <Link href="/admin/clubs">
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Temporary Password</h3>
              <p className="text-sm text-muted-foreground">
                Send this password to the organizer. They can change it later.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3 font-mono text-sm">
              <span className="flex-1 select-all">{tempPassword}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleDone} className="w-full">Done</Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout roles={['Admin']}>
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Add Club</h1>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contact</label>
            <Input
              type="tel"
              value={contact}
              onChange={e => setContact(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Input
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password (optional)</label>
            <Input
              type="password"
              placeholder="Leave empty to auto-generate"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm font-medium">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'creating...' : 'Create Club'}
          </Button>
        </form>
      </div>
    </AppLayout>
  )
}
