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
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: value.count,
      amount: value.amount,
    }))

  // Custom label renderer with better text positioning
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props
    if (percent === 0) return null

    // Calculate label position
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Status</CardTitle>
        <CardDescription>Distribution of invoice statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No invoice data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                label={renderLabel}
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#8884d8'} />
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
        )}
      </CardContent>
    </Card>
  )
}
