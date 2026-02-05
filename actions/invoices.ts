'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateTaxFromLineItems } from '@/lib/tax-calculator'

export async function getInvoices() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(name, email),
      line_items:invoice_line_items(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getInvoice(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(*),
      line_items:invoice_line_items(*),
      payments(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getClientInvoices(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('issue_date', { ascending: false })

  if (error) throw error
  return data
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient()

  const lineItemsData = formData.get('lineItems') as string
  const lineItems = JSON.parse(lineItemsData)

  // Generate invoice number
  const { data: numberData } = await supabase
    .rpc('generate_invoice_number')

  const invoiceNumber = numberData || 'INV-000001'

  // Calculate totals using tax calculator
  const taxCalc = calculateTaxFromLineItems(lineItems)

  // Calculate due date (default 30 days)
  const issueDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      client_id: formData.get('client_id'),
      invoice_number: invoiceNumber,
      status: 'draft',
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: formData.get('due_date') || dueDate.toISOString().split('T')[0],
      notes: formData.get('notes') || null,
      subtotal: taxCalc.subtotal,
      taxable_subtotal: taxCalc.taxable_subtotal,
      exempt_subtotal: taxCalc.exempt_subtotal,
      tax_rate: 0, // Deprecated - using per-item tax rates
      tax_amount: taxCalc.total_tax,
      total: taxCalc.total,
      amount_paid: 0,
      amount_due: taxCalc.total,
    })
    .select()
    .single()

  if (error) throw error

  // Create line items with tax_rate
  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('invoice_line_items')
      .insert(
        lineItems.map((item: any, index: number) => ({
          invoice_id: invoice.id,
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

  revalidatePath('/dashboard/invoices')
  return invoice
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient()

  const lineItemsData = formData.get('lineItems') as string
  const lineItems = JSON.parse(lineItemsData)

  // Calculate totals using tax calculator
  const taxCalc = calculateTaxFromLineItems(lineItems)

  // Update invoice
  const { error } = await supabase
    .from('invoices')
    .update({
      client_id: formData.get('client_id'),
      due_date: formData.get('due_date'),
      notes: formData.get('notes') || null,
      subtotal: taxCalc.subtotal,
      taxable_subtotal: taxCalc.taxable_subtotal,
      exempt_subtotal: taxCalc.exempt_subtotal,
      tax_rate: 0, // Deprecated - using per-item tax rates
      tax_amount: taxCalc.total_tax,
      total: taxCalc.total,
      amount_due: taxCalc.total, // Recalculate amount_due
    })
    .eq('id', id)

  if (error) throw error

  // Delete existing line items and recreate
  await supabase.from('invoice_line_items').delete().eq('invoice_id', id)

  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('invoice_line_items')
      .insert(
        lineItems.map((item: any, index: number) => ({
          invoice_id: id,
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

  revalidatePath(`/dashboard/invoices/${id}`)
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/invoices')
}

// Convert estimate to invoice
export async function convertEstimateToInvoice(estimateId: string) {
  const supabase = await createClient()

  // Get estimate with line items
  const { data: estimate, error: estimateError } = await supabase
    .from('estimates')
    .select(`
      *,
      client:clients(*),
      line_items:estimate_line_items(*)
    `)
    .eq('id', estimateId)
    .single()

  if (estimateError) throw estimateError

  // Generate invoice number
  const { data: numberData } = await supabase
    .rpc('generate_invoice_number')

  const invoiceNumber = numberData || 'INV-000001'

  // Calculate due date (30 days from now)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  // Create invoice with estimate totals
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      client_id: estimate.client_id,
      estimate_id: estimateId,
      invoice_number: invoiceNumber,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: estimate.subtotal,
      taxable_subtotal: estimate.taxable_subtotal || 0,
      exempt_subtotal: estimate.exempt_subtotal || 0,
      tax_rate: 0, // Deprecated
      tax_amount: estimate.tax_amount,
      total: estimate.total,
      amount_paid: 0,
      amount_due: estimate.total,
    })
    .select()
    .single()

  if (error) throw error

  // Copy line items with tax_rate
  if (estimate.line_items && estimate.line_items.length > 0) {
    const { error: itemsError } = await supabase
      .from('invoice_line_items')
      .insert(
        estimate.line_items.map((item: any) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          tax_rate: (item as any).tax_rate ?? 13,
          sort_order: item.sort_order,
        }))
      )

    if (itemsError) throw itemsError
  }

  revalidatePath('/dashboard/invoices')
  return invoice
}

// Calculate and update late fees for an invoice
export async function calculateLateFees(invoiceId: string) {
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('due_date, total, late_fee_rate, late_fee_amount, amount_paid, amount_due, status')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return

  // Check if invoice is overdue
  const today = new Date()
  const dueDate = new Date(invoice.due_date)

  if (today <= dueDate) {
    // Not overdue yet, reset late fees if they exist
    if (invoice.late_fee_amount && invoice.late_fee_amount > 0) {
      await supabase
        .from('invoices')
        .update({
          late_fee_amount: 0,
          amount_due: Number(invoice.total) - Number(invoice.amount_paid),
          status: invoice.status === 'overdue' ? 'sent' : invoice.status,
        })
        .eq('id', invoiceId)
      revalidatePath(`/dashboard/invoices/${invoiceId}`)
    }
    return
  }

  // Calculate days overdue
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate late fee (percentage of original total per day)
  const lateFeeRate = invoice.late_fee_rate || 0
  const baseAmount = Number(invoice.total)
  const lateFeeAmount = (baseAmount * (lateFeeRate / 100)) * daysOverdue

  // Update invoice with late fees
  const { error } = await supabase
    .from('invoices')
    .update({
      late_fee_amount: lateFeeAmount,
      amount_due: baseAmount + lateFeeAmount - Number(invoice.amount_paid),
      status: 'overdue',
    })
    .eq('id', invoiceId)

  if (error) throw error
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}
