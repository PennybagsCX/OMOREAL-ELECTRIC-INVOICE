// Create test estimates and invoices
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

async function getTestData() {
  // Get admin user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const adminUser = users.find(u => u.email === 'admin@example.com')

  if (!adminUser) {
    throw new Error('Admin user not found')
  }

  // Get clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('team_id', adminUser.id)

  return { adminUser, clients }
}

async function generateEstimateNumber() {
  const { data } = await supabase
    .from('estimates')
    .select('estimate_number')
    .order('created_at', { ascending: false })
    .limit(1)

  const lastNumber = data?.[0]?.estimate_number || 'EST-000000'
  const num = parseInt(lastNumber.split('-')[1]) + 1
  return `EST-${String(num).padStart(6, '0')}`
}

async function generateInvoiceNumber() {
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1)

  const lastNumber = data?.[0]?.invoice_number || 'INV-000000'
  const num = parseInt(lastNumber.split('-')[1]) + 1
  return `INV-${String(num).padStart(6, '0')}`
}

// Calculate valid until date (30 days from now)
function getValidUntilDate() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

// Calculate due date (14 days from now)
function getDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().split('T')[0]
}

async function createEstimates() {
  const { adminUser, clients } = await getTestData()

  if (!clients || clients.length === 0) {
    console.log('No clients found. Please create clients first.')
    return
  }

  console.log('Creating test estimates...')

  // Estimate 1: Draft estimate for TechFlow Solutions
  const client1 = clients.find(c => c.name === 'TechFlow Solutions')
  if (client1) {
    const estimateNumber = await generateEstimateNumber()
    const { data: estimate1, error: e1Error } = await supabase
      .from('estimates')
      .insert({
        team_id: adminUser.id,
        client_id: client1.id,
        estimate_number: estimateNumber,
        status: 'draft',
        valid_until: getValidUntilDate(),
        subtotal: 4500,
        tax_rate: 8.5,
        tax_amount: 382.50,
        total: 4882.50,
        notes: 'New office wiring project'
      })
      .select()
      .single()

    if (!e1Error && estimate1) {
      // Add line items
      await supabase.from('estimate_line_items').insert([
        {
          estimate_id: estimate1.id,
          description: 'Electrical Panel Upgrade - 200A service',
          quantity: 1,
          unit: 'each',
          rate: 2500,
          amount: 2500,
          sort_order: 0
        },
        {
          estimate_id: estimate1.id,
          description: 'LED Lighting Installation - 20 fixtures',
          quantity: 20,
          unit: 'each',
          rate: 100,
          amount: 2000,
          sort_order: 1
        }
      ])
      console.log(`✓ Created draft estimate: ${estimateNumber} for ${client1.name}`)
    }
  }

  // Estimate 2: Sent estimate for Mountain View Electric
  const client2 = clients.find(c => c.name === 'Mountain View Electric')
  if (client2) {
    const estimateNumber = await generateEstimateNumber()
    const { data: estimate2, error: e2Error } = await supabase
      .from('estimates')
      .insert({
        team_id: adminUser.id,
        client_id: client2.id,
        estimate_number: estimateNumber,
        status: 'sent',
        valid_until: getValidUntilDate(),
        subtotal: 3200,
        tax_rate: 8.5,
        tax_amount: 272,
        total: 3472,
        notes: 'Warehouse electrical upgrade'
      })
      .select()
      .single()

    if (!e2Error && estimate2) {
      await supabase.from('estimate_line_items').insert([
        {
          estimate_id: estimate2.id,
          description: '3-Phase Circuit Installation',
          quantity: 5,
          unit: 'circuit',
          rate: 400,
          amount: 2000,
          sort_order: 0
        },
        {
          estimate_id: estimate2.id,
          description: 'Conduit and Wiring',
          quantity: 120,
          unit: 'feet',
          rate: 10,
          amount: 1200,
          sort_order: 1
        }
      ])
      console.log(`✓ Created sent estimate: ${estimateNumber} for ${client2.name}`)
    }
  }
}

async function createInvoices() {
  const { adminUser, clients } = await getTestData()

  if (!clients || clients.length === 0) {
    console.log('No clients found.')
    return
  }

  console.log('Creating test invoices...')

  // Invoice 1: Paid invoice for TechFlow Solutions
  const client1 = clients.find(c => c.name === 'TechFlow Solutions')
  if (client1) {
    const invoiceNumber = await generateInvoiceNumber()
    const { data: invoice1, error: i1Error } = await supabase
      .from('invoices')
      .insert({
        team_id: adminUser.id,
        client_id: client1.id,
        invoice_number: invoiceNumber,
        status: 'paid',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: getDueDate(),
        subtotal: 1800,
        tax_rate: 8.5,
        tax_amount: 153,
        late_fee_rate: 1.5,
        late_fee_amount: 0,
        total: 1953,
        amount_paid: 1953,
        amount_due: 0,
        paid_at: new Date().toISOString(),
        notes: 'Emergency repair service'
      })
      .select()
      .single()

    if (!i1Error && invoice1) {
      await supabase.from('invoice_line_items').insert([
        {
          invoice_id: invoice1.id,
          description: 'Emergency Electrical Repair',
          quantity: 1,
          unit: 'each',
          rate: 150,
          amount: 150,
          sort_order: 0
        },
        {
          invoice_id: invoice1.id,
          description: 'Replacement Parts',
          quantity: 10,
          unit: 'hours',
          rate: 165,
          amount: 1650,
          sort_order: 1
        }
      ])

      // Add payment
      await supabase.from('payments').insert({
        invoice_id: invoice1.id,
        amount: 1953,
        method: 'credit_card',
        notes: 'Paid in full'
      })

      console.log(`✓ Created paid invoice: ${invoiceNumber} for ${client1.name}`)
    }
  }

  // Invoice 2: Partial payment invoice for Mountain View Electric
  const client2 = clients.find(c => c.name === 'Mountain View Electric')
  if (client2) {
    const invoiceNumber = await generateInvoiceNumber()
    const { data: invoice2, error: i2Error } = await supabase
      .from('invoices')
      .insert({
        team_id: adminUser.id,
        client_id: client2.id,
        invoice_number: invoiceNumber,
        status: 'partial',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: getDueDate(),
        subtotal: 5200,
        tax_rate: 8.5,
        tax_amount: 442,
        late_fee_rate: 1.5,
        late_fee_amount: 0,
        total: 5642,
        amount_paid: 2000,
        amount_due: 3642,
        notes: 'Panel replacement project - phase 1'
      })
      .select()
      .single()

    if (!i2Error && invoice2) {
      await supabase.from('invoice_line_items').insert([
        {
          invoice_id: invoice2.id,
          description: 'Main Panel Replacement',
          quantity: 1,
          unit: 'each',
          rate: 3500,
          amount: 3500,
          sort_order: 0
        },
        {
          invoice_id: invoice2.id,
          description: 'Sub-panel Installation',
          quantity: 1,
          unit: 'each',
          rate: 1700,
          amount: 1700,
          sort_order: 1
        }
      ])

      // Add partial payment
      await supabase.from('payments').insert({
        invoice_id: invoice2.id,
        amount: 2000,
        method: 'check',
        notes: 'Deposit payment'
      })

      console.log(`✓ Created partial invoice: ${invoiceNumber} for ${client2.name}`)
    }
  }

  // Invoice 3: Overdue invoice
  if (client1) {
    const invoiceNumber = await generateInvoiceNumber()
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 30) // 30 days ago

    const { data: invoice3, error: i3Error } = await supabase
      .from('invoices')
      .insert({
        team_id: adminUser.id,
        client_id: client1.id,
        invoice_number: invoiceNumber,
        status: 'overdue',
        issue_date: pastDate.toISOString().split('T')[0],
        due_date: new Date(pastDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 1200,
        tax_rate: 8.5,
        tax_amount: 102,
        late_fee_rate: 1.5,
        late_fee_amount: 18,
        total: 1320,
        amount_paid: 0,
        amount_due: 1320,
        notes: 'Outlet and switch replacement - OVERDUE'
      })
      .select()
      .single()

    if (!i3Error && invoice3) {
      await supabase.from('invoice_line_items').insert([
        {
          invoice_id: invoice3.id,
          description: 'GFCI Outlet Replacement',
          quantity: 15,
          unit: 'each',
          rate: 80,
          amount: 1200,
          sort_order: 0
        }
      ])
      console.log(`✓ Created overdue invoice: ${invoiceNumber} for ${client1.name}`)
    }
  }
}

async function main() {
  try {
    await createEstimates()
    await createInvoices()
    console.log('\n✅ Test data created successfully!')
    console.log('\nSummary:')
    console.log('- 2 Clients (TechFlow Solutions, Mountain View Electric)')
    console.log('- 2 Estimates (1 draft, 1 sent)')
    console.log('- 3 Invoices (1 paid, 1 partial, 1 overdue)')
  } catch (error) {
    console.error('Error creating test data:', error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
