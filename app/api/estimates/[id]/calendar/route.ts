import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEstimate } from '@/actions/estimates'
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
  const estimate = await getEstimate(id)

  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  }

  // Create event at 9 AM on the valid_until date (1 hour duration)
  const validUntil = new Date(estimate.valid_until)
  validUntil.setHours(9, 0, 0, 0)
  const endTime = new Date(validUntil)
  endTime.setHours(endTime.getHours() + 1)

  const event = {
    uid: `estimate-${estimate.id}@electrician-invoices`,
    title: `Quote Expires: ${estimate.estimate_number}`,
    description: `Quote ${estimate.estimate_number} expires on this date\nClient: ${estimate.client?.name || 'N/A'}\nTotal: $${estimate.total?.toFixed(2) || '0.00'}\nStatus: ${estimate.status}${estimate.notes ? `\n\nNotes: ${estimate.notes}` : ''}`,
    startTime: validUntil,
    endTime: endTime,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/estimates/${estimate.id}`,
    status: (estimate.status === 'accepted' || estimate.status === 'expired' || estimate.status === 'rejected' ? 'CANCELLED' : 'TENTATIVE') as 'CANCELLED' | 'TENTATIVE',
  }

  const icsContent = generateICS(event)

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${estimate.estimate_number}-reminder.ics"`,
    },
  })
}
