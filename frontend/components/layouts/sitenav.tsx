'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useauth } from '@/lib/authcontext'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'

const navlinks: Record<string, { href: string; label: string }[]> = {
  Participant: [
    { href: '/dashboard', label: 'dashboard' },
    { href: '/events', label: 'events' },
    { href: '/clubs', label: 'clubs' },
  ],
  Organizer: [
    { href: '/organizer', label: 'dashboard' },
    { href: '/organizer/events', label: 'my events' },
    { href: '/organizer/create', label: 'create' },
  ],
  Admin: [
    { href: '/admin', label: 'dashboard' },
    { href: '/admin/clubs', label: 'clubs' },
    { href: '/admin/requests', label: 'requests' },
  ],
}

export function SiteNav() {
  const path = usePathname()
  const { user, logout } = useauth()
  if (!user) return null

  const links = navlinks[user.role] || []
  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || user.email[0])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">felicity</span>
          {user.role !== 'Participant' && (
            <span className="text-xs text-muted-foreground">/{user.role.toLowerCase()}</span>
          )}
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                path === l.href ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.firstName && <p className="font-medium">{user.firstName}</p>}
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={user.role === 'Participant' ? '/profile' : `/${user.role.toLowerCase()}/profile`}>
                  <User className="mr-2 h-4 w-4" />
                  profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
