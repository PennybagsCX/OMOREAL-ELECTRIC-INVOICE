/**
 * Generate ICS (iCalendar) file content for events
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */

export interface ICSEvent {
  uid: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  location?: string
  url?: string
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
}

/**
 * Format date for ICS file: YYYYMMDDTHHmmssZ
 */
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Escape text for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generate ICS file content for a single event
 */
export function generateICS(event: ICSEvent): string {
  const now = new Date()

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Electrician Invoices//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${formatDateToICS(now)}
DTSTART:${formatDateToICS(event.startTime)}
DTEND:${formatDateToICS(event.endTime)}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description)}
${event.location ? `LOCATION:${escapeICS(event.location)}\n` : ''}${event.url ? `URL:${event.url}\n` : ''}${event.status ? `STATUS:${event.status}\n` : ''}END:VEVENT
END:VCALENDAR`
}

/**
 * Generate ICS file content for multiple events
 */
export function generateMultiEventICS(events: ICSEvent[]): string {
  const now = new Date()

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Electrician Invoices//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Electrician Invoices
X-WR-TIMEZONE:America/Toronto
X-WR-CALDESC:Invoice and Estimate Due Dates
`

  for (const event of events) {
    ics += `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${formatDateToICS(now)}
DTSTART:${formatDateToICS(event.startTime)}
DTEND:${formatDateToICS(event.endTime)}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description)}
${event.location ? `LOCATION:${escapeICS(event.location)}\n` : ''}${event.url ? `URL:${event.url}\n` : ''}${event.status ? `STATUS:${event.status}\n` : ''}END:VEVENT
`
  }

  ics += `END:VCALENDAR`
  return ics
}
