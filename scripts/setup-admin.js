// Setup script to create admin user
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local file
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAdmin() {
  const email = 'admin@example.com'
  const password = 'admin123'

  console.log('Checking if admin user exists...')

  // Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  const existingUser = users.find(u => u.email === email)

  if (existingUser) {
    console.log('Admin user already exists:', existingUser.email)

    // Update password to match expected
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
    } else {
      console.log('Admin password updated successfully')
    }
  } else {
    console.log('Creating new admin user...')

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    })

    if (error) {
      console.error('Error creating admin user:', error)
    } else {
      console.log('Admin user created successfully:', data.user.email)

      // Create profile entry (no email column in profiles table)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          role: 'admin'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      } else {
        console.log('Profile created successfully')
      }
    }
  }
}

setupAdmin()
  .then(() => {
    console.log('\nSetup complete!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Setup failed:', err)
    process.exit(1)
  })
