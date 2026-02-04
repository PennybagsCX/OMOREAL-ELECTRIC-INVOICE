import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEstimates } from '@/actions/estimates'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const estimates = await getEstimates()
  return NextResponse.json(estimates || [])
}
