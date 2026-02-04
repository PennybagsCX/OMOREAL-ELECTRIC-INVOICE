'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SavedLineItem {
  id: string
  team_id: string
  name: string
  description: string
  quantity: number
  unit: string | null
  rate: number
  tax_rate: number
  category: string | null
  is_active: boolean
  use_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface GetSavedLineItemsOptions {
  category?: string
  activeOnly?: boolean
  search?: string
  sortBy?: 'name' | 'use_count' | 'last_used_at' | 'created_at'
}

/**
 * Get all saved line items for the team
 */
export async function getSavedLineItems(options?: GetSavedLineItemsOptions): Promise<SavedLineItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('saved_line_items')
    .select('*')
    .order(options?.sortBy || 'name', { ascending: true })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.activeOnly !== false) {
    query = query.eq('is_active', true)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return (data as SavedLineItem[]) || []
}

/**
 * Get a single saved line item
 */
export async function getSavedLineItem(id: string): Promise<SavedLineItem> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_line_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SavedLineItem
}

/**
 * Create a saved line item
 */
export async function createSavedLineItem(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const data = {
    team_id: user.id,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    quantity: Number(formData.get('quantity')) || 1,
    unit: formData.get('unit') as string || null,
    rate: Number(formData.get('rate')) || 0,
    tax_rate: Number(formData.get('tax_rate')) || 13,
    category: formData.get('category') as string || null,
  }

  const { error } = await supabase.from('saved_line_items').insert(data)

  if (error) throw error
  revalidatePath('/dashboard/settings/line-items')
}

/**
 * Update a saved line item
 */
export async function updateSavedLineItem(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    quantity: Number(formData.get('quantity')) || 1,
    unit: formData.get('unit') as string || null,
    rate: Number(formData.get('rate')) || 0,
    tax_rate: Number(formData.get('tax_rate')) || 13,
    category: formData.get('category') as string || null,
    is_active: formData.get('is_active') === 'true',
  }

  const { error } = await supabase
    .from('saved_line_items')
    .update(data)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/settings/line-items')
}

/**
 * Delete a saved line item
 */
export async function deleteSavedLineItem(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saved_line_items')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/settings/line-items')
}

/**
 * Soft delete (deactivate) a saved line item
 */
export async function deactivateSavedLineItem(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saved_line_items')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/settings/line-items')
}

/**
 * Track usage of a saved line item
 */
export async function trackSavedLineItemUsage(id: string) {
  const supabase = await createClient()

  // First get current use_count
  const { data: current } = await supabase
    .from('saved_line_items')
    .select('use_count')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('saved_line_items')
    .update({
      use_count: (current?.use_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Get unique categories
 */
export async function getSavedLineItemCategories(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_line_items')
    .select('category')
    .not('category', 'is', null)

  if (error) throw error
  return [...new Set(data?.map(d => d.category).filter(Boolean) || [])]
}

/**
 * Save current line item as a saved line item
 */
export async function saveLineItemFromForm(item: {
  name: string
  description: string
  quantity: number
  unit: string
  rate: number
  tax_rate?: number
  category?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('saved_line_items').insert({
    team_id: user.id,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit || null,
    rate: item.rate,
    tax_rate: item.tax_rate || 13,
    category: item.category || null,
  })

  if (error) throw error
  revalidatePath('/dashboard/settings/line-items')
}
