import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { email, role } = await req.json()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Insert team invitation
    const { error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        email,
        role,
        invited_by: user.id,
        status: 'pending'
      })

    if (inviteError) {
      throw inviteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 400 }
    )
  }
}
