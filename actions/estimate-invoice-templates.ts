'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateTaxFromLineItems } from '@/lib/tax-calculator'
import { revalidatePath } from 'next/cache'

export interface TemplateLineItem {
  id?: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  tax_rate: number
}

export interface Template {
  id: string
  team_id: string
  template_type: 'estimate' | 'invoice'
  name: string
  description: string | null
  notes: string | null
  internal_notes: string | null
  due_date_days: number | null
  valid_until_days: number | null
  subtotal: number
  taxable_subtotal: number
  exempt_subtotal: number
  tax_amount: number
  total: number
  line_items_count: number
  use_count: number
  last_used_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  line_items?: TemplateLineItem[]
}

export interface GetTemplatesOptions {
  type?: 'estimate' | 'invoice' | 'both'
  search?: string
  sortBy?: 'name' | 'last_used_at' | 'use_count' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
  activeOnly?: boolean
}

/**
 * Get all templates with optional filtering
 */
export async function getTemplates(options: GetTemplatesOptions = {}) {
  const supabase = await createClient()

  const {
    type = 'both',
    search,
    sortBy = 'last_used_at',
    sortOrder = 'desc',
    activeOnly = true,
  } = options

  let query = supabase
    .from('estimate_invoice_templates')
    .select('*')
    .order(sortBy, { ascending: sortOrder === 'asc' })

  // Filter by type
  if (type !== 'both') {
    query = query.eq('template_type', type)
  }

  // Filter active only
  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  // Search by name or description
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return data as Template[]
}

/**
 * Get a single template with line items
 */
export async function getTemplate(id: string) {
  const supabase = await createClient()

  const { data: template, error: templateError } = await supabase
    .from('estimate_invoice_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (templateError) {
    console.error('Error fetching template:', templateError)
    return null
  }

  const { data: lineItems, error: itemsError } = await supabase
    .from('estimate_invoice_template_line_items')
    .select('*')
    .eq('template_id', id)
    .order('sort_order', { ascending: true })

  if (itemsError) {
    console.error('Error fetching template line items:', itemsError)
  }

  return {
    ...template,
    line_items: lineItems || [],
  } as Template
}

/**
 * Create a new template from form data
 */
export async function createTemplate(formData: {
  template_type: 'estimate' | 'invoice'
  name: string
  description?: string
  notes?: string
  internal_notes?: string
  due_date_days?: number
  valid_until_days?: number
  line_items: TemplateLineItem[]
}) {
  const supabase = await createClient()

  // Calculate totals
  const taxCalc = calculateTaxFromLineItems(formData.line_items)

  // Create template
  const { data: template, error: templateError } = await supabase
    .from('estimate_invoice_templates')
    .insert({
      template_type: formData.template_type,
      name: formData.name,
      description: formData.description || null,
      notes: formData.notes || null,
      internal_notes: formData.internal_notes || null,
      due_date_days: formData.due_date_days || null,
      valid_until_days: formData.valid_until_days || null,
      subtotal: taxCalc.subtotal,
      taxable_subtotal: taxCalc.taxable_subtotal,
      exempt_subtotal: taxCalc.exempt_subtotal,
      tax_amount: taxCalc.total_tax,
      total: taxCalc.total,
      line_items_count: formData.line_items.length,
    })
    .select()
    .single()

  if (templateError) {
    console.error('Error creating template:', templateError)
    throw new Error('Failed to create template')
  }

  // Insert line items
  const { error: itemsError } = await supabase
    .from('estimate_invoice_template_line_items')
    .insert(
      formData.line_items.map((item, index) => ({
        template_id: template.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || null,
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate),
        tax_rate: Number(item.tax_rate),
        sort_order: index,
      }))
    )

  if (itemsError) {
    console.error('Error creating template line items:', itemsError)
    throw new Error('Failed to create template line items')
  }

  revalidatePath('/dashboard/settings/templates')
  return template
}

/**
 * Create a template from an existing estimate
 */
export async function createTemplateFromEstimate(
  estimateId: string,
  name: string,
  description?: string
) {
  const supabase = await createClient()

  // Get estimate with line items
  const { data: estimate, error: estimateError } = await supabase
    .from('estimates')
    .select(`
      *,
      estimate_line_items (*)
    `)
    .eq('id', estimateId)
    .single()

  if (estimateError || !estimate) {
    console.error('Error fetching estimate:', estimateError)
    throw new Error('Estimate not found')
  }

  // Calculate valid_until_days from valid_until date
  let validUntilDays = 30
  if (estimate.valid_until) {
    const validDate = new Date(estimate.valid_until)
    const createdDate = new Date(estimate.created_at)
    const diffTime = validDate.getTime() - createdDate.getTime()
    validUntilDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Create template
  return createTemplate({
    template_type: 'estimate',
    name,
    description,
    notes: estimate.notes || undefined,
    internal_notes: estimate.internal_notes || undefined,
    valid_until_days: validUntilDays,
    line_items: estimate.estimate_line_items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || '',
      rate: item.rate,
      amount: item.amount,
      tax_rate: item.tax_rate,
    })),
  })
}

/**
 * Create a template from an existing invoice
 */
export async function createTemplateFromInvoice(
  invoiceId: string,
  name: string,
  description?: string
) {
  const supabase = await createClient()

  // Get invoice with line items
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_line_items (*)
    `)
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    console.error('Error fetching invoice:', invoiceError)
    throw new Error('Invoice not found')
  }

  // Calculate due_date_days from due_date
  let dueDateDays = 30
  if (invoice.due_date && invoice.issue_date) {
    const dueDate = new Date(invoice.due_date)
    const issueDate = new Date(invoice.issue_date)
    const diffTime = dueDate.getTime() - issueDate.getTime()
    dueDateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Create template
  return createTemplate({
    template_type: 'invoice',
    name,
    description,
    notes: invoice.notes || undefined,
    due_date_days: dueDateDays,
    line_items: invoice.invoice_line_items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || '',
      rate: item.rate,
      amount: item.amount,
      tax_rate: item.tax_rate,
    })),
  })
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  id: string,
  formData: {
    name?: string
    description?: string
    notes?: string
    internal_notes?: string
    due_date_days?: number
    valid_until_days?: number
    line_items?: TemplateLineItem[]
  }
) {
  const supabase = await createClient()

  // If line items are being updated, recalculate totals
  let updateData: any = {}
  if (formData.line_items) {
    const taxCalc = calculateTaxFromLineItems(formData.line_items)
    updateData = {
      ...updateData,
      subtotal: taxCalc.subtotal,
      taxable_subtotal: taxCalc.taxable_subtotal,
      exempt_subtotal: taxCalc.exempt_subtotal,
      tax_amount: taxCalc.total_tax,
      total: taxCalc.total,
      line_items_count: formData.line_items.length,
    }
  }

  if (formData.name) updateData.name = formData.name
  if (formData.description !== undefined) updateData.description = formData.description || null
  if (formData.notes !== undefined) updateData.notes = formData.notes || null
  if (formData.internal_notes !== undefined) updateData.internal_notes = formData.internal_notes || null
  if (formData.due_date_days !== undefined) updateData.due_date_days = formData.due_date_days || null
  if (formData.valid_until_days !== undefined) updateData.valid_until_days = formData.valid_until_days || null

  const { error: updateError } = await supabase
    .from('estimate_invoice_templates')
    .update(updateData)
    .eq('id', id)

  if (updateError) {
    console.error('Error updating template:', updateError)
    throw new Error('Failed to update template')
  }

  // Update line items if provided
  if (formData.line_items) {
    // Delete existing line items
    await supabase
      .from('estimate_invoice_template_line_items')
      .delete()
      .eq('template_id', id)

    // Insert new line items
    const { error: itemsError } = await supabase
      .from('estimate_invoice_template_line_items')
      .insert(
        formData.line_items.map((item, index) => ({
          template_id: id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || null,
          rate: Number(item.rate),
          amount: Number(item.quantity) * Number(item.rate),
          tax_rate: Number(item.tax_rate),
          sort_order: index,
        }))
      )

    if (itemsError) {
      console.error('Error updating template line items:', itemsError)
      throw new Error('Failed to update template line items')
    }
  }

  revalidatePath('/dashboard/settings/templates')
  return { success: true }
}

/**
 * Delete (deactivate) a template
 */
export async function deleteTemplate(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('estimate_invoice_templates')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting template:', error)
    throw new Error('Failed to delete template')
  }

  revalidatePath('/dashboard/settings/templates')
  return { success: true }
}

/**
 * Track template usage (increment use count and update last used)
 */
export async function trackTemplateUsage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('estimate_invoice_templates')
    .update({
      use_count: (await supabase.from('estimate_invoice_templates').select('use_count').eq('id', id).single()).data
        ?.use_count || 0,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error tracking template usage:', error)
  }

  // Also increment use_count atomically
  const { error: rpcError } = await supabase.rpc('increment', {
    table_name: 'estimate_invoice_templates',
    column_name: 'use_count',
    row_id: id,
  })
  // Fallback if RPC doesn't exist - ignore error
  if (rpcError && !rpcError.message.includes('function')) {
    console.warn('RPC increment failed:', rpcError.message)
  }

  return { success: true }
}
