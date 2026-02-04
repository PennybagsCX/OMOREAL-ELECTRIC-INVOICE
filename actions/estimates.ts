'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { convertEstimateToInvoice } from '@/actions/invoices'
import { calculateTaxFromLineItems } from '@/lib/tax-calculator'

export async function getEstimates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estimates')
    .select(`
      *,
      client:clients(name, email),
      line_items:estimate_line_items(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getEstimate(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estimates')
    .select(`
      *,
      client:clients(*),
      line_items:estimate_line_items(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createEstimate(formData: FormData) {
  const supabase = await createClient()

  // Get line items from form data
  const lineItemsData = formData.get('lineItems') as string
  const lineItems = JSON.parse(lineItemsData)

  // Generate estimate number
  const { data: numberData } = await supabase
    .rpc('generate_estimate_number')

  const estimateNumber = numberData || 'EST-000001'

  // Calculate totals using tax calculator
  const taxCalc = calculateTaxFromLineItems(lineItems)

  // Create estimate
  const { data: estimate, error } = await supabase
    .from('estimates')
    .insert({
      client_id: formData.get('client_id'),
      estimate_number: estimateNumber,
      status: 'draft',
      valid_until: formData.get('valid_until'),
      notes: formData.get('notes') || null,
      subtotal: taxCalc.subtotal,
      taxable_subtotal: taxCalc.taxable_subtotal,
      exempt_subtotal: taxCalc.exempt_subtotal,
      tax_rate: 0, // Deprecated - using per-item tax rates
      tax_amount: taxCalc.total_tax,
      total: taxCalc.total,
    })
    .select()
    .single()

  if (error) throw error

  // Create line items with tax_rate
  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('estimate_line_items')
      .insert(
        lineItems.map((item: any, index: number) => ({
          estimate_id: estimate.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || null,
          rate: Number(item.rate),
          amount: Number(item.quantity) * Number(item.rate),
          tax_rate: Number(item.tax_rate ?? 13),
          sort_order: index,
        }))
      )

    if (itemsError) throw itemsError
  }

  revalidatePath('/dashboard/estimates')
  return estimate
}

export async function updateEstimate(id: string, formData: FormData) {
  const supabase = await createClient()

  const lineItemsData = formData.get('lineItems') as string
  const lineItems = JSON.parse(lineItemsData)

  // Calculate totals using tax calculator
  const taxCalc = calculateTaxFromLineItems(lineItems)

  // Update estimate
  const { error } = await supabase
    .from('estimates')
    .update({
      client_id: formData.get('client_id'),
      valid_until: formData.get('valid_until'),
      notes: formData.get('notes') || null,
      subtotal: taxCalc.subtotal,
      taxable_subtotal: taxCalc.taxable_subtotal,
      exempt_subtotal: taxCalc.exempt_subtotal,
      tax_rate: 0, // Deprecated - using per-item tax rates
      tax_amount: taxCalc.total_tax,
      total: taxCalc.total,
    })
    .eq('id', id)

  if (error) throw error

  // Delete existing line items and recreate
  await supabase.from('estimate_line_items').delete().eq('estimate_id', id)

  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('estimate_line_items')
      .insert(
        lineItems.map((item: any, index: number) => ({
          estimate_id: id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || null,
          rate: Number(item.rate),
          amount: Number(item.quantity) * Number(item.rate),
          tax_rate: Number(item.tax_rate ?? 13),
          sort_order: index,
        }))
      )

    if (itemsError) throw itemsError
  }

  revalidatePath(`/dashboard/estimates/${id}`)
}

export async function updateEstimateStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('estimates')
    .update({ status })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/estimates')
}

export async function deleteEstimate(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('estimates')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/estimates')
}

// Generate a public token for an estimate
export async function generateEstimatePublicToken(estimateId: string) {
  const supabase = await createClient()

  // Generate a random token
  const token = crypto.randomUUID()

  // Store token
  const { error } = await supabase
    .from('estimates')
    .update({ public_token: token })
    .eq('id', estimateId)

  if (error) throw error
  return token
}

// Get estimate by public token
export async function getEstimateByToken(token: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('estimates')
    .select(`
      *,
      client:clients(*),
      business:business_profiles(*),
      line_items:estimate_line_items(*)
    `)
    .eq('public_token', token)
    .single()

  if (error) return null
  return data
}

// Record estimate view
export async function recordEstimateView(estimateId: string, ipAddress?: string, userAgent?: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase.from('estimate_views').insert({
    estimate_id: estimateId,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  // Update estimate status to viewed
  await supabase
    .from('estimates')
    .update({ status: 'viewed' })
    .eq('id', estimateId)
}

// Accept estimate
export async function acceptEstimate(token: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: estimate } = await supabase
    .from('estimates')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('public_token', token)
    .select()
    .single()

  if (!estimate) throw new Error('Invalid or expired link')

  return estimate
}

// Expire old estimates
export async function expireOldEstimates() {
  const supabase = await createClient()

  const today = new Date()

  const { data } = await supabase
    .from('estimates')
    .select('id, valid_until, status')
    .in('status', ['draft', 'sent', 'viewed'])

  if (!data) return

  for (const estimate of data) {
    const validUntil = new Date(estimate.valid_until)
    if (validUntil < today) {
      await supabase
        .from('estimates')
        .update({ status: 'expired' })
        .eq('id', estimate.id)
    }
  }

  revalidatePath('/dashboard/estimates')
}

// Wrapper actions for form submissions
export async function deleteEstimateAndRevalidate(formData: FormData) {
  const id = formData.get('id') as string
  await deleteEstimate(id)
}

export async function updateEstimateStatusAndRevalidate(formData: FormData) {
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  await updateEstimateStatus(id, status)
  revalidatePath(`/dashboard/estimates/${id}`)
}

export async function generateEstimateTokenAndRevalidate(formData: FormData) {
  const id = formData.get('id') as string
  await generateEstimatePublicToken(id)
  revalidatePath(`/dashboard/estimates/${id}`)
}

export async function convertEstimateToInvoiceWithRedirect(formData: FormData) {
  const id = formData.get('id') as string
  await convertEstimateToInvoice(id)
  redirect('/dashboard/invoices')
}
