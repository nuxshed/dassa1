'use client'

import { ProtectedRoute } from '@/components/protection'
import { FloatingSidebar } from './sidebar'
import type { role } from '@/lib/types'

interface props {
  children: React.ReactNode
  roles?: role[]
}

export function AppLayout({ children, roles }: props) {
  return (
    <ProtectedRoute allowedroles={roles}>
      <div className="relative min-h-screen pb-16 md:pb-0">
        <FloatingSidebar />
        <main className="px-6 py-12">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
