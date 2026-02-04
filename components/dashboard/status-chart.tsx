'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

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
      color: COLORS[status.toLowerCase() as keyof typeof COLORS] || '#8884d8',
    }))

  // Custom label renderer with better text positioning
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    if (percent === 0 || percent < 0.05) return null

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Custom legend component with better layout
  const CustomLegend = ({ data }: { data: typeof chartData }) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}</span>
            <span className="text-muted-foreground">({entry.value})</span>
          </div>
        ))}
      </div>
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
          <div className="h-[300px] flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">No invoice data available</p>
              <p className="text-sm">Create invoices to see status breakdown</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value?: number, name?: string, props?: any) => [
                    `${value || 0} invoices`,
                    `$${(props?.payload?.amount || 0).toFixed(2)}`,
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend data={chartData} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
