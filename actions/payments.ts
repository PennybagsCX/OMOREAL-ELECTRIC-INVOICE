'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPayments(invoiceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data
}

export async function createPayment(formData: FormData) {
  const supabase = await createClient()

  const invoiceId = formData.get('invoice_id') as string
  const amount = Number(formData.get('amount'))

  // Create payment
  const { error } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount,
      payment_method: formData.get('payment_method') || null,
      payment_date: formData.get('payment_date') || new Date().toISOString().split('T')[0],
      notes: formData.get('notes') || null,
      transaction_id: formData.get('transaction_id') || null,
    })

  if (error) throw error

  // Update invoice totals
  await updateInvoicePaymentTotals(invoiceId)

  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

export async function deletePayment(paymentId: string, invoiceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)

  if (error) throw error

  // Update invoice totals
  await updateInvoicePaymentTotals(invoiceId)

  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

// Helper function to update invoice payment totals
async function updateInvoicePaymentTotals(invoiceId: string) {
  const supabase = await createClient()

  // Get total payments for this invoice
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  const amountPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Get invoice details
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, late_fee_amount')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return

  const total = Number(invoice.total) + Number(invoice.late_fee_amount || 0)
  const amountDue = total - amountPaid

  // Determine new status
  let newStatus = 'draft'
  if (amountPaid > 0 && amountPaid < total) {
    newStatus = 'partial'
  } else if (amountPaid >= total) {
    newStatus = 'paid'
  }

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      amount_paid: amountPaid,
      amount_due: amountDue,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', invoiceId)
}
