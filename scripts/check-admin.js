// Check admin user and reset if needed
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAndFixAdmin() {
  console.log('Checking admin users...')

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  console.log('\nAll users:')
  users.forEach(u => {
    console.log(`- ${u.email} (id: ${u.id})`)
  })

  // Find the admin user by various possible emails
  const adminUser = users.find(u =>
    u.email === 'admin@local' ||
    u.email === 'admin@example.com' ||
    u.email.includes('admin')
  )

  if (!adminUser) {
    console.log('\n❌ No admin user found! Creating one...')

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@local',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    })

    if (error) {
      console.error('Error creating admin:', error)
      return
    }

    console.log('✅ Created admin user')

    // Create profile
    await supabase.from('profiles').insert({
      id: data.user.id,
      role: 'admin'
    })

    // Test login
    console.log('\nTesting login with new user...')
    const testClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: 'admin@local',
      password: 'admin123'
    })

    if (signInError) {
      console.error('❌ Login failed:', signInError.message)
    } else {
      console.log('✅ Login successful!')
    }
    return
  }

  console.log(`\nFound admin user: ${adminUser.email}`)
  console.log(`ID: ${adminUser.id}`)
  console.log(`Email confirmed: ${adminUser.email_confirmed_at}`)
  console.log(`Created at: ${adminUser.created_at}`)
  console.log(`Last sign in: ${adminUser.last_sign_in_at}`)

  // Test login with current credentials
  console.log('\nTesting login...')

  // First try with admin@local
  const testClient = createClient(supabaseUrl, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
    email: 'admin@local',
    password: 'admin123'
  })

  if (signInError) {
    console.log(`❌ Login with admin@local failed: ${signInError.message}`)

    // Try the old email
    const { data: signInData2, error: signInError2 } = await testClient.auth.signInWithPassword({
      email: adminUser.email,
      password: 'admin123'
    })

    if (signInError2) {
      console.log(`❌ Login with ${adminUser.email} also failed: ${signInError2.message}`)
      console.log('\nResetting password...')

      const { error: resetError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        {
          password: 'admin123',
          email_confirm: true
        }
      )

      if (resetError) {
        console.error('Error resetting password:', resetError)
      } else {
        console.log('✅ Password reset to: admin123')
        console.log(`Email remains: ${adminUser.email}`)
      }
    } else {
      console.log(`✅ Login works with email: ${adminUser.email} and password: admin123`)
    }
  } else {
    console.log('✅ Login successful with admin@local / admin123')
  }
}

checkAndFixAdmin()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
