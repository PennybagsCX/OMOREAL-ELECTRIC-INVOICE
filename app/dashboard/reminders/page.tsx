import { getInvoicesNeedingReminders } from '@/actions/reminders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CalendarSubscriptionButtons } from '@/components/reminders/calendar-subscription-buttons'

export default async function RemindersPage() {
  const invoices = await getInvoicesNeedingReminders()

  const today = new Date()

  function getDaysText(dueDate: string) {
    const due = new Date(dueDate)
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  // Generate webcal feed URL (replace localhost with actual domain in production)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const feedUrl = `${baseUrl}/api/calendar/feed?token=demo-token`
  const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://')

  return (
    <div className="container py-8 px-4 w-full overflow-x-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Payment Reminders</h1>
      </div>

      {/* Calendar Feed Subscription */}
      <Card className="mb-6 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Subscribe to Calendar Feed
          </CardTitle>
          <CardDescription>
            Get all invoice and estimate due dates in your calendar app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarSubscriptionButtons feedUrl={feedUrl} webcalUrl={webcalUrl} />
        </CardContent>
      </Card>

      {invoices?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No invoices needing reminders at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} need{invoices.length === 1 ? 's' : ''} attention
            </p>
          </div>
          <div className="space-y-3">
            {invoices?.map((invoice: any) => {
              const isOverdue = new Date(invoice.due_date) < today

              return (
                <Card key={invoice.id} className={isOverdue ? 'border-orange-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                        <CardDescription>{invoice.client?.name}</CardDescription>
                      </div>
                      <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                        {isOverdue ? 'OVERDUE' : 'Due Soon'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-medium">{getDaysText(invoice.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Amount Due</p>
                        <p className="font-bold text-lg">
                          ${invoice.amount_due?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="text-foreground">
                        <Link href={`/api/invoices/${invoice.id}/calendar`} download>
                          <Calendar className="h-4 w-4 mr-2" />
                          Add to Calendar
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          View Invoice
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
