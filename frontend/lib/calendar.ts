import { event } from './types'

export function generateGoogleCalendarLink(ev: event, reminderMinutes?: number): string {
  const start = formatGoogleDate(ev.dates.start)
  const end = formatGoogleDate(ev.dates.end)
  const details = ev.description ? encodeURIComponent(ev.description) : ''
  const text = encodeURIComponent(ev.name)
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`
}

export function generateOutlookCalendarLink(ev: event): string {
  const start = formatOutlookDate(ev.dates.start)
  const end = formatOutlookDate(ev.dates.end)
  const subject = encodeURIComponent(ev.name)
  const body = ev.description ? encodeURIComponent(ev.description) : ''

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${subject}&body=${body}`
}

function formatGoogleDate(d: string | Date): string {
  const date = new Date(d)
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function formatOutlookDate(d: string | Date): string {
  const date = new Date(d)
  return date.toISOString()
}

export function generateIcs(events: event[], reminderMinutes?: number): string {
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DASS Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  events.forEach(ev => {
    const start = formatIcsDate(ev.dates.start)
    const end = formatIcsDate(ev.dates.end)
    const now = formatIcsDate(new Date())
    
    const uid = ev._id ? `${ev._id}@dass.events` : `${start}-${end}@dass.events`

    ics.push('BEGIN:VEVENT')
    ics.push(`UID:${uid}`)
    ics.push(`DTSTAMP:${now}`)
    ics.push(`DTSTART:${start}`)
    ics.push(`DTEND:${end}`)
    ics.push(`SUMMARY:${escapeIcsText(ev.name)}`)
    if (ev.description) {
      ics.push(`DESCRIPTION:${escapeIcsText(ev.description)}`)
    }

    if (reminderMinutes && reminderMinutes > 0) {
      ics.push('BEGIN:VALARM')
      ics.push('ACTION:DISPLAY')
      ics.push(`DESCRIPTION:Reminder for ${escapeIcsText(ev.name)}`)
      ics.push(`TRIGGER:-PT${reminderMinutes}M`)
      ics.push('END:VALARM')
    }

    ics.push('END:VEVENT')
  })

  ics.push('END:VCALENDAR')
  return ics.join('\r\n')
}

function formatIcsDate(d: string | Date): string {
  const date = new Date(d)
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function downloadIcs(icsString: string, filename: string) {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.setAttribute('download', `${filename}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
