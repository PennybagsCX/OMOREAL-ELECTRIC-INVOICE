'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get invoices that need reminders (overdue or due soon)
export async function getInvoicesNeedingReminders() {
  const supabase = await createClient()

  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(*)
    `)
    .in('status', ['sent', 'partial', 'overdue'])
    .lt('due_date', nextWeek.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

// Mark reminder as sent (create a note or log)
export async function sendReminder(invoiceId: string) {
  const supabase = await createClient()

  // For now, we'll just add a note to the invoice
  // In production, this would send an email via Resend, SendGrid, or Supabase Edge Functions

  const { data: invoice } = await supabase
    .from('invoices')
    .select('notes')
    .eq('id', invoiceId)
    .single()

  const reminderNote = `[Reminder sent ${new Date().toLocaleDateString()}]`
  const updatedNotes = invoice?.notes
    ? `${invoice.notes}\n${reminderNote}`
    : reminderNote

  await supabase
    .from('invoices')
    .update({ notes: updatedNotes })
    .eq('id', invoiceId)

  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  revalidatePath('/dashboard/reminders')

  // TODO: Integrate with email service
  // Example: Call Supabase Edge Function to send email
}

// Get count of invoices needing reminders for dashboard
export async function getRemindersCount() {
  const supabase = await createClient()

  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .in('status', ['sent', 'partial', 'overdue'])
    .lt('due_date', nextWeek.toISOString().split('T')[0])

  if (error) throw error
  return count || 0
}
