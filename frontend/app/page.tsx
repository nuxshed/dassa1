'use client'

import { useauth } from '@/lib/authcontext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const routes: Record<string, string> = {
  Admin: '/admin',
  Organizer: '/organizer',
  Participant: '/dashboard',
}

export default function HomePage() {
  const { user, loading } = useauth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(user ? routes[user.role] || '/dashboard' : '/login')
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">loading...</p>
    </div>
  )
}
