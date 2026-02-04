import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Direct admin user creation using service role key
 * Bypasses email signup restrictions
 *
 * SECURITY: Requires SETUP_TOKEN environment variable to prevent unauthorized access
 */
export async function POST(request: Request) {
  // Check for setup token to prevent unauthorized access
  const setupToken = request.headers.get('x-setup-token')
  const expectedToken = process.env.SETUP_TOKEN

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'Server configuration error: SETUP_TOKEN not set' },
      { status: 500 }
    )
  }

  if (setupToken !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid setup token' },
      { status: 401 }
    )
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create user directly in auth.users using admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Admin',
      }
    })

    if (userError) {
      // User might already exist, check if we can update their metadata
      if (userError.message.includes('already been registered') || userError.message.includes('already exists')) {
        // Try to get the existing user and update their profile
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === email)

        if (existingUser) {
          // Update/create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.id,
              full_name: 'Admin',
              role: 'admin',
            }, { onConflict: 'id' })

          if (profileError) {
            return NextResponse.json(
              { error: profileError.message },
              { status: 500 }
            )
          }

          return NextResponse.json({
            success: true,
            message: 'Admin account already exists, profile updated',
            user: {
              id: existingUser.id,
              email: existingUser.email,
            }
          })
        }
      }
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    // Create profile entry
    if (userData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userData.user.id,
          full_name: 'Admin',
          role: 'admin',
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: userData.user?.id,
        email: userData.user?.email,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create admin account' },
      { status: 500 }
    )
  }
}
