import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { InvoiceStatusChart } from '@/components/dashboard/status-chart'
import { getAgedReceivables } from '@/actions/dashboard'
import { getRevenueData } from '@/actions/reports'
import { getInvoiceStatusBreakdown } from '@/actions/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ReportsPage() {
  const [agedReceivables, revenueData, statusBreakdown] = await Promise.all([
    getAgedReceivables(),
    getRevenueData(12),
    getInvoiceStatusBreakdown(),
  ])

  return (
    <div className="container py-8 px-4 w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <RevenueChart data={revenueData} months={12} />
        <InvoiceStatusChart breakdown={statusBreakdown} />
      </div>

      {/* Aged Receivables */}
      <Card>
        <CardHeader>
          <CardTitle>Aged Receivables</CardTitle>
          <CardDescription>Outstanding invoices grouped by overdue days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AgedReceivableRow
              label="Current"
              days="Not overdue"
              count={agedReceivables.current.count}
              amount={agedReceivables.current.amount}
              variant="default"
            />
            <AgedReceivableRow
              label="1-30 Days"
              days="Overdue"
              count={agedReceivables.overdue1to30.count}
              amount={agedReceivables.overdue1to30.amount}
              variant="secondary"
            />
            <AgedReceivableRow
              label="31-60 Days"
              days="Overdue"
              count={agedReceivables.overdue31to60.count}
              amount={agedReceivables.overdue31to60.amount}
              variant="warning"
            />
            <AgedReceivableRow
              label="61+ Days"
              days="Overdue"
              count={agedReceivables.overdue61plus.count}
              amount={agedReceivables.overdue61plus.amount}
              variant="destructive"
            />
          </div>

          {/* Total */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Outstanding:</span>
              <span className="text-xl font-bold">
                ${(
                  agedReceivables.current.amount +
                  agedReceivables.overdue1to30.amount +
                  agedReceivables.overdue31to60.amount +
                  agedReceivables.overdue61plus.amount
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AgedReceivableRow({
  label,
  days,
  count,
  amount,
  variant,
}: {
  label: string
  days: string
  count: number
  amount: number
  variant: 'default' | 'secondary' | 'warning' | 'destructive'
}) {
  const colors = {
    default: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary text-secondary-foreground',
    warning: 'bg-orange-500/10 text-orange-500',
    destructive: 'bg-red-500/10 text-red-500',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <Badge variant={variant as any}>{label}</Badge>
        <span className="text-sm text-muted-foreground">{days}</span>
      </div>
      <div className="text-right">
        <p className="font-semibold">${amount.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{count} invoices</p>
      </div>
    </div>
  )
}
