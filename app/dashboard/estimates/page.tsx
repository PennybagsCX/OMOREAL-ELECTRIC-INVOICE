'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'

const statusColors: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  viewed: 'outline',
  accepted: 'default',
  expired: 'destructive',
  rejected: 'destructive',
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/estimates', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) {
            // Unauthorized - redirect to login
            window.location.href = '/login'
            return []
          }
          throw new Error('Failed to fetch estimates')
        }
        return res.json()
      })
      .then(data => {
        setEstimates(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setEstimates([])
        setLoading(false)
      })
  }, [])

  const columns = [
    {
      key: 'estimate_number',
      label: 'Estimate #',
      render: (item: any) => <span className="font-medium">{item.estimate_number}</span>,
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
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <Badge variant={statusColors[item.status] as any}>{item.status}</Badge>
      ),
    },
    {
      key: 'valid_until',
      label: 'Valid Until',
      render: (item: any) => new Date(item.valid_until).toLocaleDateString(),
    },
  ]

  return (
    <div className="container py-8 px-4 w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estimates</h1>
        <Button asChild>
          <Link href="/dashboard/estimates/new">New Estimate</Link>
        </Button>
      </div>

      <DataTable
        data={estimates || []}
        columns={columns}
        filters={{ status: true }}
        getRowLink={(item) => `/dashboard/estimates/${item.id}`}
      />
    </div>
  )
}
