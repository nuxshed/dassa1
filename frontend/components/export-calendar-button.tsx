'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import { Calendar, Download, ExternalLink, CalendarPlus } from 'lucide-react'
import type { event } from '@/lib/types'
import { generateGoogleCalendarLink, generateOutlookCalendarLink, generateIcs, downloadIcs } from '@/lib/calendar'

interface ExportCalendarProps {
  events: event | event[]
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ExportCalendarButton({ events, label = 'Export Calendar', variant = 'outline', size = 'default' }: ExportCalendarProps) {
  const [reminder, setReminder] = useState<number>(15) // default 15 mins
  
  const isBatch = Array.isArray(events)
  const eventList = isBatch ? events : [events]
  const isSingle = eventList.length === 1

  if (eventList.length === 0) return null

  const handleDownload = () => {
    const icsString = generateIcs(eventList, reminder)
    const filename = eventList.length > 1 ? 'my-events' : (eventList[0].name.replace(/\s+/g, '-').toLowerCase() || 'event')
    downloadIcs(icsString, filename)
  }

  const handleGoogle = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (eventList.length !== 1) return
    window.open(generateGoogleCalendarLink(eventList[0], reminder), '_blank')
  }

  const handleOutlook = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (eventList.length !== 1) return
    window.open(generateOutlookCalendarLink(eventList[0]), '_blank')
  }

  const remindersOptions = [
    { label: 'None', value: 0 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant={variant} size={size} className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          <span className={size === 'icon' ? 'sr-only' : ''}>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Reminder: {remindersOptions.find(r => r.value === reminder)?.label || '15 mins'}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {remindersOptions.map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => setReminder(opt.value)}>
                 {opt.label} {reminder === opt.value && '✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(); }}>
          <Download className="mr-2 h-4 w-4" />
          <span>Download .ics file</span>
        </DropdownMenuItem>

        {isSingle && (
          <>
            <DropdownMenuItem onClick={handleGoogle}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Add to Google Calendar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOutlook}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Add to Outlook</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
