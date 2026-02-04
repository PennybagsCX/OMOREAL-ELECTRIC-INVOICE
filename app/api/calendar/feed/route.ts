import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMultiEventICS } from '@/lib/ics'

/**
 * Webcal feed for all invoices and estimates
 * Subscribe in calendar app with: webcal://your-domain.com/api/calendar/feed?token=YOUR_TOKEN
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Token validation - CALENDAR_FEED_TOKEN must be set
  const validToken = process.env.CALENDAR_FEED_TOKEN

  if (!validToken) {
    return NextResponse.json(
      { error: 'Server configuration error: CALENDAR_FEED_TOKEN not set' },
      { status: 500 }
    )
  }

  if (token !== validToken) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid calendar feed token' },
      { status: 401 }
    )
  }

  const supabase = await createClient()

  // Get all pending/partial/overdue invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, due_date, status, amount_due, notes, client:clients(name)')
    .in('status', ['sent', 'partial', 'overdue'])
    .order('due_date', { ascending: true })

  // Get all pending/sent/viewed estimates
  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, valid_until, status, total, notes, client:clients(name)')
    .in('status', ['draft', 'sent', 'viewed'])
    .order('valid_until', { ascending: true })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Convert invoices to calendar events
  const invoiceEvents = (invoices || []).map((invoice: any) => {
    const dueDate = new Date(invoice.due_date)
    dueDate.setHours(9, 0, 0, 0)
    const endTime = new Date(dueDate)
    endTime.setHours(endTime.getHours() + 1)

    return {
      uid: `invoice-${invoice.id}@electrician-invoices`,
      title: `Payment Due: ${invoice.invoice_number}`,
      description: `Payment for invoice ${invoice.invoice_number}\nClient: ${invoice.client?.name || 'N/A'}\nAmount Due: $${invoice.amount_due?.toFixed(2) || '0.00'}${invoice.notes ? `\n\nNotes: ${invoice.notes}` : ''}`,
      startTime: dueDate,
      endTime: endTime,
      url: `${baseUrl}/dashboard/invoices/${invoice.id}`,
      status: invoice.status === 'paid' ? ('CANCELLED' as const) : ('CONFIRMED' as const),
    }
  })

  // Convert estimates to calendar events
  const estimateEvents = (estimates || []).map((estimate: any) => {
    const validUntil = new Date(estimate.valid_until)
    validUntil.setHours(10, 0, 0, 0)
    const endTime = new Date(validUntil)
    endTime.setHours(endTime.getHours() + 1)

    return {
      uid: `estimate-${estimate.id}@electrician-invoices`,
      title: `Quote Expires: ${estimate.estimate_number}`,
      description: `Quote ${estimate.estimate_number} expires on this date\nClient: ${estimate.client?.name || 'N/A'}\nTotal: $${estimate.total?.toFixed(2) || '0.00'}\nStatus: ${estimate.status}${estimate.notes ? `\n\nNotes: ${estimate.notes}` : ''}`,
      startTime: validUntil,
      endTime: endTime,
      url: `${baseUrl}/dashboard/estimates/${estimate.id}`,
      status: estimate.status === 'accepted' || estimate.status === 'expired' || estimate.status === 'rejected' ? ('CANCELLED' as const) : ('TENTATIVE' as const),
    }
  })

  // Combine all events
  const allEvents = [...invoiceEvents, ...estimateEvents]

  const icsContent = generateMultiEventICS(allEvents)

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
