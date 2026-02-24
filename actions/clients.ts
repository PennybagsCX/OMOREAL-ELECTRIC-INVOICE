'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Email validation helper
function validateEmail(email: string | null): string {
  if (!email || !email.trim()) {
    throw new Error('Email is required')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    throw new Error('Please enter a valid email address')
  }

  return email.trim()
}

export async function getClients() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('team_id', user.id)  // Only return clients for this user's team
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getClient(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const email = validateEmail(formData.get('email') as string)

  const data = {
    team_id: user.id,
    name: formData.get('name') as string,
    email: email,
    phone: formData.get('phone') as string || null,
    address: formData.get('address') as string || null,
    notes: formData.get('notes') as string || null,
  }

  const { error } = await supabase.from('clients').insert(data)

  if (error) throw error
  revalidatePath('/dashboard/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient()

  const email = validateEmail(formData.get('email') as string)

  const data = {
    name: formData.get('name') as string,
    email: email,
    phone: formData.get('phone') as string || null,
    address: formData.get('address') as string || null,
    notes: formData.get('notes') as string || null,
  }

  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', id)

  if (error) throw error
  revalidatePath(`/dashboard/clients/${id}`)
}

export async function deleteClient(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/clients')
}

// Delete client with checks for related invoices and estimates
export async function deleteClientWithChecks(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()

  // Check for related invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id')
    .eq('client_id', id)

  // Check for related estimates
  const { data: estimates, error: estimatesError } = await supabase
    .from('estimates')
    .select('id')
    .eq('client_id', id)

  const invoiceCount = invoices?.length || 0
  const estimateCount = estimates?.length || 0

  // If any exist, throw error with counts
  if (invoiceCount > 0 || estimateCount > 0) {
    throw new Error(
      `Cannot delete client with ${invoiceCount} invoice(s) and ${estimateCount} estimate(s). Please delete these records first.`
    )
  }

  // Safe to delete
  await deleteClient(id)
}

// Helper function to create a client inline (from estimate/invoice forms)
// Returns the ID of the created client
export async function createClientInline(clientData: {
  name: string
  email: string
  phone?: string
  address?: string
}): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate email is required
  if (!clientData.email || !clientData.email.trim()) {
    throw new Error('Email is required when creating a new client')
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clientData.email.trim())) {
    throw new Error('Please enter a valid email address')
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      team_id: user.id,
      name: clientData.name,
      email: clientData.email.trim(),
      phone: clientData.phone?.trim() || null,
      address: clientData.address || null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}
