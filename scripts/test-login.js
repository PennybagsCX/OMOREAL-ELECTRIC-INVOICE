// Test login script
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

async function testLogin() {
  const email = 'admin@example.com'
  const password = 'admin123'

  console.log('Testing login with:', email)
  console.log('Password:', password)

  // Test with admin client
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login failed:', error.message)
    console.error('Error details:', error)

    // Try to reset the password
    console.log('\nAttempting to reset password...')
    const { data: users } = await supabase.auth.admin.listUsers()
    const adminUser = users.find(u => u.email === email)

    if (adminUser) {
      console.log('Found user:', adminUser.id)

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { password: 'admin123', email_confirm: true }
      )

      if (updateError) {
        console.error('Failed to update password:', updateError)
      } else {
        console.log('Password reset successfully')

        // Try logging in again
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: 'admin123',
        })

        if (loginError) {
          console.error('Still failed to login:', loginError)
        } else {
          console.log('Login successful after reset!')
          console.log('User:', loginData.user.email)
        }
      }
    }
  } else {
    console.log('Login successful!')
    console.log('User:', data.user.email)
    console.log('Session:', data.session)
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err)
    process.exit(1)
  })
