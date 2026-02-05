'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'

const statusColors: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  partial: 'warning',
  paid: 'success',
  overdue: 'destructive',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) {
            // Unauthorized - redirect to login
            window.location.href = '/login'
            return []
          }
          throw new Error('Failed to fetch invoices')
        }
        return res.json()
      })
      .then(data => {
        setInvoices(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setInvoices([])
        setLoading(false)
      })
  }, [])

  const columns = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (item: any) => <span className="font-medium">{item.invoice_number}</span>,
    },
    {
      key: 'client',
      label: 'Client',
      render: (item: any) => item.client?.name || 'No client',
    },
    {
      key: 'total',
      label: 'Total',
      render: (item: any) => `$${Number(item.total).toFixed(2)}`,
    },
    {
      key: 'amount_due',
      label: 'Amount Due',
      render: (item: any) => {
        const totalWithLateFee = Number(item.total) + Number(item.late_fee_amount || 0)
        const amountDue = totalWithLateFee - Number(item.amount_paid)
        return `$${amountDue.toFixed(2)}`
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <Badge variant={statusColors[item.status] as any}>
          {item.status === 'paid' ? 'PAID' : item.status === 'partial' ? 'PARTIAL' : item.status === 'overdue' ? 'OVERDUE' : item.status}
        </Badge>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (item: any) => new Date(item.due_date).toLocaleDateString(),
    },
  ]

  return (
    <div className="container py-8 px-4 w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button asChild>
          <Link href="/dashboard/invoices/new">New Invoice</Link>
        </Button>
      </div>

      <DataTable
        data={invoices || []}
        columns={columns}
        filters={{ status: true }}
        getRowLink={(item) => `/dashboard/invoices/${item.id}`}
      />
    </div>
  )
}
