'use client'

import { ProtectedRoute } from '@/components/protection'
import { FloatingSidebar, AccountMenu } from './sidebar'
import { useauth } from '@/lib/authcontext'
import type { role } from '@/lib/types'

interface props {
  children: React.ReactNode
  roles?: role[]
}

export function AppLayout({ children, roles }: props) {
  const { user } = useauth()
  const isParticipant = user?.role === 'Participant'

  return (
    <ProtectedRoute allowedroles={roles}>
      <div className="relative min-h-screen pb-16 md:pb-0">
        {isParticipant ? (
          <FloatingSidebar />
        ) : (
          <div className="fixed left-6 bottom-4 z-50 hidden md:block">
            <AccountMenu />
          </div>
        )}
        <main className="px-6 py-12">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
