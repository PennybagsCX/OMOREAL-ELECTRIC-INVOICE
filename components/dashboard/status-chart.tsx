'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  partial: '#f59e0b',
  paid: '#22c55e',
  overdue: '#ef4444',
}

interface InvoiceStatusChartProps {
  breakdown: Record<string, { count: number; amount: number }>
}

export function InvoiceStatusChart({ breakdown }: InvoiceStatusChartProps) {
  const chartData = Object.entries(breakdown)
    .filter(([_, value]: [string, any]) => value.count > 0)
    .map(([status, value]: [string, any]) => ({
      name: status,
      value: value.count,
      amount: value.amount,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Status</CardTitle>
        <CardDescription>Distribution of invoice statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value?: number, name?: string, props?: any) => [
                `${value || 0} invoices`,
                `$${(props?.payload?.amount || 0).toFixed(2)}`,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
