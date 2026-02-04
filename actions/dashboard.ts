'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()

  // Get current month and year
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Outstanding invoices (sent, partial, overdue)
  const { data: outstanding } = await supabase
    .from('invoices')
    .select('total, amount_paid, late_fee_amount')
    .in('status', ['sent', 'partial', 'overdue'])

  const outstandingTotal = outstanding?.reduce((sum, inv) => {
    return sum + (Number(inv.total) + Number(inv.late_fee_amount || 0)) - Number(inv.amount_paid)
  }, 0) || 0

  // This month's revenue (paid invoices this month)
  const { data: paidThisMonth } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', firstDayOfMonth.toISOString().split('T')[0])

  const monthlyRevenue = paidThisMonth?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Pending estimates (draft, sent, viewed - not accepted/expired/rejected)
  const { count: pendingEstimates } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'sent', 'viewed'])

  // Recent activity (last 5)
  const { data: recentActivity } = await supabase
    .from('invoices')
    .select('id, invoice_number, created_at, client:clients(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Due soon invoices (due in next 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const { data: dueSoonInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, due_date, total, status, client:clients(name, email)')
    .in('status', ['sent', 'partial'])
    .gte('due_date', now.toISOString().split('T')[0])
    .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(5)

  // Overdue invoices
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, due_date, total, amount_paid, late_fee_amount, client:clients(name, email)')
    .in('status', ['sent', 'partial', 'overdue'])
    .lt('due_date', now.toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(5)

  // Estimates expiring soon (valid until in next 7 days)
  const { data: expiringEstimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, valid_until, total, status, client:clients(name, email)')
    .in('status', ['sent', 'viewed'])
    .gte('valid_until', now.toISOString().split('T')[0])
    .lte('valid_until', sevenDaysFromNow.toISOString().split('T')[0])
    .order('valid_until', { ascending: true })
    .limit(5)

  return {
    outstandingInvoices: outstandingTotal,
    monthlyRevenue,
    pendingEstimates: pendingEstimates || 0,
    recentActivity: recentActivity || [],
    dueSoonInvoices: dueSoonInvoices || [],
    overdueInvoices: overdueInvoices || [],
    expiringEstimates: expiringEstimates || [],
  }
}

// Get stats for a specific date range
export async function getStatsForRange(startDate: string, endDate: string) {
  const supabase = await createClient()

  // Revenue in range
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Invoices created in range
  const { count: invoicesCreated } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Estimates created in range
  const { count: estimatesCreated } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  return {
    revenue,
    invoicesCreated: invoicesCreated || 0,
    estimatesCreated: estimatesCreated || 0,
  }
}

// Get aged receivables (invoices grouped by how overdue they are)
export async function getAgedReceivables() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('due_date, total, amount_paid, late_fee_amount, status, client:clients(name)')
    .in('status', ['sent', 'partial', 'overdue'])

  const now = new Date()

  const buckets = {
    current: { count: 0, amount: 0 }, // Not overdue
    overdue1to30: { count: 0, amount: 0 }, // 1-30 days overdue
    overdue31to60: { count: 0, amount: 0 }, // 31-60 days overdue
    overdue61plus: { count: 0, amount: 0 }, // 61+ days overdue
  }

  invoices?.forEach((inv) => {
    const dueDate = new Date(inv.due_date)
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const amountDue = (Number(inv.total) + Number(inv.late_fee_amount || 0)) - Number(inv.amount_paid)

    if (daysOverdue <= 0) {
      buckets.current.count++
      buckets.current.amount += amountDue
    } else if (daysOverdue <= 30) {
      buckets.overdue1to30.count++
      buckets.overdue1to30.amount += amountDue
    } else if (daysOverdue <= 60) {
      buckets.overdue31to60.count++
      buckets.overdue31to60.amount += amountDue
    } else {
      buckets.overdue61plus.count++
      buckets.overdue61plus.amount += amountDue
    }
  })

  return buckets
}
