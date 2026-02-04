import { Suspense } from 'react'
import Link from 'next/link'
import { getDashboardStats } from '@/actions/dashboard'
import { PageContainer } from '@/components/layout/page-container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CurrentTime } from '@/components/dashboard/current-time'
import { DollarSign, TrendingUp, FileText, AlertCircle, Clock, Calendar, ArrowRight, UserPlus, FilePlus, Receipt } from 'lucide-react'

async function StatCard({
  title,
  value,
  description,
  icon: Icon
}: {
  title: string
  value: string | number
  description: string
  icon: any
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

async function DashboardStats() {
  const stats = await getDashboardStats()

  return (
    <>
      <StatCard
        title="Outstanding Invoices"
        value={`$${stats.outstandingInvoices.toFixed(2)}`}
        description="Total amount unpaid"
        icon={DollarSign}
      />
      <StatCard
        title="Monthly Revenue"
        value={`$${stats.monthlyRevenue.toFixed(2)}`}
        description="This month's payments"
        icon={TrendingUp}
      />
      <StatCard
        title="Pending Estimates"
        value={stats.pendingEstimates}
        description="Awaiting client response"
        icon={FileText}
      />
    </>
  )
}

function DueSoonList({
  title,
  icon: Icon,
  items,
  type
}: {
  title: string
  icon: any
  items: any[]
  type: 'invoice' | 'estimate'
}) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-orange-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const date = type === 'invoice' ? item.due_date : item.valid_until
            const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            const urgencyClass = daysUntil <= 2 ? 'text-red-600' : daysUntil <= 5 ? 'text-orange-600' : 'text-yellow-600'

            return (
              <Link
                key={item.id}
                href={`/dashboard/${type}s/${item.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{type === 'invoice' ? item.invoice_number : item.estimate_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.client?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <Badge variant="outline" className={`text-xs ${urgencyClass}`}>
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </Badge>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function OverdueList({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          Overdue Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const daysOverdue = Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))
            const amountDue = (Number(item.total) + Number(item.late_fee_amount || 0)) - Number(item.amount_paid)

            return (
              <Link
                key={item.id}
                href={`/dashboard/invoices/${item.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.invoice_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.client?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <Badge variant="destructive" className="text-xs">
                      {daysOverdue} days overdue
                    </Badge>
                    <p className="text-sm font-semibold text-red-600">${amountDue.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <Suspense fallback={<div className="h-5 w-48" />}>
          <CurrentTime />
        </Suspense>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Suspense fallback={<Skeleton className="h-24" />}>
          <DashboardStats />
        </Suspense>
      </div>

      {/* Follow-up Section */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" aria-hidden="true" />
        Follow-ups & Due Dates
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <Suspense fallback={<Skeleton className="h-48" />}>
          <FollowUpLists />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Create new documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/clients/new">
                <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Add Client</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/estimates/new">
                <FilePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>New Estimate</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/invoices/new">
                <Receipt className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>New Invoice</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

async function FollowUpLists() {
  const stats = await getDashboardStats()

  const hasFollowUps =
    (stats.overdueInvoices?.length ?? 0) > 0 ||
    (stats.dueSoonInvoices?.length ?? 0) > 0 ||
    (stats.expiringEstimates?.length ?? 0) > 0

  if (!hasFollowUps) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No follow-ups needed at this time</p>
            <p className="text-sm text-muted-foreground mt-1">All invoices and estimates are up to date!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <OverdueList items={stats.overdueInvoices} />
      <DueSoonList
        title="Invoices Due Soon"
        icon={Clock}
        items={stats.dueSoonInvoices}
        type="invoice"
      />
      <DueSoonList
        title="Estimates Expiring Soon"
        icon={Calendar}
        items={stats.expiringEstimates}
        type="estimate"
      />
    </>
  )
}
