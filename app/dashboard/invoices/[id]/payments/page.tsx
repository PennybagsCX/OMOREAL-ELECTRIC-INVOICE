import { getInvoice } from '@/actions/invoices'
import { getPayments } from '@/actions/payments'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentTracker } from '@/components/invoices/payment-tracker'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  partial: 'warning',
  paid: 'success',
  overdue: 'destructive',
}

export default async function InvoicePaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [invoice, payments] = await Promise.all([
    getInvoice(id),
    getPayments(id),
  ])

  if (!invoice) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-8 px-4 w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-6 w-full overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-bold w-full overflow-x-hidden">{invoice.invoice_number} - Payments</h1>
          <p className="text-muted-foreground w-full overflow-x-hidden">{invoice.client?.name}</p>
        </div>
        <Badge variant={statusColors[invoice.status] as any}>
          {invoice.status === 'paid' ? 'PAID' : invoice.status === 'partial' ? 'PARTIAL' : invoice.status === 'overdue' ? 'OVERDUE' : invoice.status}
        </Badge>
      </div>

      <PaymentTracker
        invoiceId={invoice.id}
        payments={payments || []}
        amountPaid={invoice.amount_paid}
        amountDue={invoice.amount_due}
      />

      <div className="mt-6 w-full overflow-x-hidden">
        <Button asChild variant="outline" className="text-foreground w-full overflow-x-hidden">
          <Link href={`/dashboard/invoices/${invoice.id}`}>Back to Invoice</Link>
        </Button>
      </div>
    </div>
  )
}
