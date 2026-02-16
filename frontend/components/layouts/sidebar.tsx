'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useauth } from '@/lib/authcontext'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  LogOut,
  Plus,
  FolderKanban,
  KeyRound,
  Sun,
  Moon,
} from 'lucide-react'
import { motion, LayoutGroup } from 'framer-motion'

const navconfig: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  Participant: [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/events', label: 'Events', icon: <Calendar className="h-5 w-5" /> },
    { href: '/organizers', label: 'Organizers', icon: <Users className="h-5 w-5" /> },
    { href: '/profile', label: 'Profile', icon: <UserCircle className="h-5 w-5" /> },
  ],
  Organizer: [
    { href: '/organizer', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/organizer/events', label: 'My Events', icon: <FolderKanban className="h-5 w-5" /> },
    { href: '/organizer/create', label: 'Create', icon: <Plus className="h-5 w-5" /> },
    { href: '/organizer/profile', label: 'Profile', icon: <UserCircle className="h-5 w-5" /> },
  ],
  Admin: [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/clubs', label: 'Clubs', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/requests', label: 'Requests', icon: <KeyRound className="h-5 w-5" /> },
  ],
}

export function FloatingSidebar() {
  const path = usePathname()
  const { user, logout } = useauth()
  const { theme, setTheme } = useTheme()
  if (!user) return null

  const links = (navconfig[user.role] || []).filter(l => l.href !== '/profile' && l.href !== '/organizer/profile')
  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || user.email[0])).toUpperCase()
  const profileLink = user.role === 'Participant' ? '/profile' : `/${user.role.toLowerCase()}/profile`

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <aside className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-1 p-2 bg-card/80 backdrop-blur-lg border-t md:bottom-auto md:left-4 md:right-auto md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-2 md:rounded-2xl md:border md:border-t-0 md:shadow-lg">
              <LayoutGroup>
                {links.map(l => {
                  const isActive = path === l.href
                  return (
                    <Tooltip key={l.href}>
                      <TooltipTrigger asChild>
                        <Link href={l.href} className="relative">
                          {isActive && (
                            <motion.div
                              layoutId="active-tab"
                              className="absolute inset-0 bg-primary rounded-xl"
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <Button
                            variant="ghost" 
                            size="icon"
                            className={cn(
                              'h-10 w-10 rounded-xl transition-colors relative z-10',
                              isActive 
                                ? 'text-primary-foreground hover:!bg-transparent hover:!text-primary-foreground' 
                                : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'
                            )}
                          >
                            {l.icon}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8} className="hidden md:block">
                        {l.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </LayoutGroup>
        </aside>
      </TooltipProvider>

      <div className="fixed left-6 bottom-4 z-50 hidden md:block">
        <AccountMenu />
      </div>
    </>
  )
}

export function AccountMenu() {
  const { user, logout } = useauth()
  const { theme, setTheme } = useTheme()
  if (!user) return null

  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || user.email[0])).toUpperCase()
  const profileLink = user.role === 'Participant' ? '/profile' : `/${user.role.toLowerCase()}/profile`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-transparent p-0">
          <Avatar className="h-10 w-10 border-2 border-border hover:border-primary/50 transition-colors cursor-pointer bg-card shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 ml-2" align="end" side="right" sideOffset={4}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.firstName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={profileLink}>
            <UserCircle className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
