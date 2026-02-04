import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClients } from '@/actions/clients'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await getClients()
  return NextResponse.json(clients || [])
}
