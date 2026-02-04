'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

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
          <div className="w-full">
            <PieChart width={400} height={300} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData}
                cx={200}
                cy={130}
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
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
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload?.value || 0})
                  </span>
                )}
              />
            </PieChart>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
