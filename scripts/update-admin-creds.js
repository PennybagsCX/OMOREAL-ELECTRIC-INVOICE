// Update admin credentials
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

async function updateAdminCredentials() {
  console.log('Updating admin credentials...')

  // Get all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  // Find existing admin user
  const existingAdmin = users.find(u => u.email === 'admin@example.com')

  if (existingAdmin) {
    console.log('Found existing admin user:', existingAdmin.email)
    console.log('Updating email to: admin@local')
    console.log('Updating password to: admin123')

    // Update email and password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingAdmin.id,
      {
        email: 'admin@local',
        password: 'admin123',
        email_confirm: true
      }
    )

    if (updateError) {
      console.error('Error updating user:', updateError)
    } else {
      console.log('✅ Admin credentials updated successfully!')
      console.log('')
      console.log('📧 Email: admin@local')
      console.log('🔑 Password: admin123')
    }
  } else {
    console.log('Creating new admin user...')

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@local',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    })

    if (error) {
      console.error('Error creating admin user:', error)
    } else {
      console.log('✅ Admin user created successfully!')
      console.log('')
      console.log('📧 Email: admin@local')
      console.log('🔑 Password: admin123')

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          role: 'admin'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      } else {
        console.log('✅ Profile created successfully')
      }
    }
  }
}

updateAdminCredentials()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
