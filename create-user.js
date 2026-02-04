import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined')

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

async function createUser() {
  console.log('Creating user...')
  
  const { data, error } = await supabase.auth.signUp({
    email: 'test@electrician.com',
    password: 'Test123456!',
    options: {
      data: {
        full_name: 'Test Electrician'
      }
    }
  })

  if (error) {
    console.error('Error:', error.message)
    // User might already exist, try to sign in instead
    console.log('Trying to sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@electrician.com',
      password: 'Test123456!'
    })
    if (signInError) {
      console.error('Sign in error:', signInError.message)
    } else {
      console.log('✅ User signed in:', signInData.user?.email)
      console.log('✅ User ID:', signInData.user?.id)
    }
  } else {
    console.log('✅ User created:', data.user?.email)
    console.log('✅ User ID:', data.user?.id)
  }
}

createUser().catch(console.error)
