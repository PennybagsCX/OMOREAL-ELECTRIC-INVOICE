// Create profile for admin user
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

async function createAdminProfile() {
  console.log('Finding admin user...')

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  const adminUser = users.find(u => u.email === 'admin@example.com')

  if (!adminUser) {
    console.error('Admin user not found!')
    return
  }

  console.log('Found admin user:', adminUser.id)

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', adminUser.id)
    .single()

  if (existingProfile) {
    console.log('Profile already exists, updating role...')
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminUser.id)

    if (error) {
      console.error('Error updating profile:', error)
    } else {
      console.log('Profile updated successfully')
    }
  } else {
    console.log('Creating profile...')
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: adminUser.id,
        role: 'admin'
      })

    if (error) {
      console.error('Error creating profile:', error)
    } else {
      console.log('Profile created successfully')
    }
  }
}

createAdminProfile()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
