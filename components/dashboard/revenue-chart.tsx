'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface RevenueChartProps {
  data: Array<{ month: string; amount: number }>
  months?: number
}

export function RevenueChart({ data, months = 12 }: RevenueChartProps) {
  const chartData = data.map((item) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    amount: item.amount,
  }))

  const hasData = chartData.some(item => item.amount > 0)
  const maxAmount = Math.max(...chartData.map(d => d.amount))

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue for the last {months} months</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">No revenue data available</p>
              <p className="text-sm">Record payments to see revenue trends</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <BarChart width={320} height={280} data={chartData} margin={{ top: 15, right: 5, bottom: 50, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, maxAmount * 1.1]}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                width={45}
              />
              <Tooltip
                formatter={(value?: number) => [`$${(value || 0).toLocaleString()}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
