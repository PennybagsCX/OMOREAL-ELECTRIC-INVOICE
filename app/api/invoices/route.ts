import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInvoices } from '@/actions/invoices'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const invoices = await getInvoices()
  return NextResponse.json(invoices || [])
}
