'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRevenueData(months: number = 12) {
  const supabase = await createClient()

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .gte('payment_date', startDate.toISOString())
    .order('payment_date', { ascending: true })

  // Group by month
  const monthlyData: Record<string, number> = {}

  // Initialize all months with 0
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = 0
  }

  // Sum payments by month
  payments?.forEach((payment) => {
    const date = new Date(payment.payment_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = (monthlyData[key] || 0) + Number(payment.amount)
  })

  // Convert to array and sort
  return Object.entries(monthlyData)
    .map(([month, amount]) => ({
      month,
      amount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export async function getInvoiceStatusBreakdown() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('status, total, amount_paid')

  const breakdown = {
    draft: { count: 0, amount: 0 },
    sent: { count: 0, amount: 0 },
    partial: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
  }

  invoices?.forEach((inv) => {
    if (breakdown[inv.status as keyof typeof breakdown]) {
      breakdown[inv.status as keyof typeof breakdown].count++
      breakdown[inv.status as keyof typeof breakdown].amount += Number(inv.total)
    }
  })

  return breakdown
}
