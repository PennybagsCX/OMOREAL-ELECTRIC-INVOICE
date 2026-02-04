import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInvoice } from '@/actions/invoices'
import { generateICS } from '@/lib/ics'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // Create event at 9 AM on the due date (1 hour duration)
  const dueDate = new Date(invoice.due_date)
  dueDate.setHours(9, 0, 0, 0)
  const endTime = new Date(dueDate)
  endTime.setHours(endTime.getHours() + 1)

  const event = {
    uid: `invoice-${invoice.id}@electrician-invoices`,
    title: `Payment Due: ${invoice.invoice_number}`,
    description: `Payment for invoice ${invoice.invoice_number}\nClient: ${invoice.client?.name || 'N/A'}\nAmount Due: $${invoice.amount_due?.toFixed(2) || '0.00'}${invoice.notes ? `\n\nNotes: ${invoice.notes}` : ''}`,
    startTime: dueDate,
    endTime: endTime,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/invoices/${invoice.id}`,
    status: (invoice.status === 'paid' || invoice.status === 'overdue' ? 'CANCELLED' : 'CONFIRMED') as 'CANCELLED' | 'CONFIRMED',
  }

  const icsContent = generateICS(event)

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}-reminder.ics"`,
    },
  })
}
