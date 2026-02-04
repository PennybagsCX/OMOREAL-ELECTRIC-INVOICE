'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: Array<{ month: string; amount: number }>
  months?: number
}

export function RevenueChart({ data, months = 12 }: RevenueChartProps) {
  // Format month labels
  const chartData = data.map((item) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    amount: item.amount,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue for the last {months} months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value?: number) => [`$${(value || 0).toFixed(2)}`, 'Revenue']}
              labelStyle={{ color: '#000' }}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
