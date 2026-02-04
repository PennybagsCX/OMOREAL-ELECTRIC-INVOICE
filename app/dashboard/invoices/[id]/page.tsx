import { getInvoice } from '@/actions/invoices'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { SaveAsTemplateButton } from '@/components/shared/save-as-template-button'

const statusColors: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  partial: 'warning',
  paid: 'success',
  overdue: 'destructive',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) {
    notFound()
  }

  // Check if there are mixed tax rates
  const hasMixedTax = (invoice as any).taxable_subtotal > 0 && (invoice as any).exempt_subtotal > 0
  const hasAnyExemptItems = invoice.line_items?.some((item: any) => (item as any).tax_rate === 0)

  return (
    <div className="container max-w-4xl py-6 px-4 pb-20">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {new Date(invoice.issue_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={statusColors[invoice.status] as any} className="shrink-0">
          {invoice.status === 'paid' ? 'PAID' : invoice.status === 'partial' ? 'PARTIAL' : invoice.status === 'overdue' ? 'OVERDUE' : invoice.status}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Bill To</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{invoice.client?.name}</p>
            {invoice.client?.email && <p className="text-sm text-muted-foreground">{invoice.client.email}</p>}
            {invoice.client?.phone && <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>}
            {invoice.client?.address && <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.client.address}</p>}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issue Date:</span>
              <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            {invoice.estimate_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Converted from Estimate:</span>
                <Link href={`/dashboard/estimates/${invoice.estimate_id}`} className="text-primary hover:underline">
                  View Estimate
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.line_items?.map((item: any) => {
                const itemTaxRate = (item as any).tax_rate ?? 13
                return (
                  <div key={item.id} className="flex justify-between items-start gap-4 py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{item.description}</p>
                        {itemTaxRate === 0 && (
                          <Badge variant="secondary" className="text-xs">Tax Exempt</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit || ''} × ${item.rate.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold shrink-0">${item.amount.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {hasMixedTax ? (
                // Show breakdown when mixed
                <>
                  <div className="flex justify-between text-sm">
                    <span>Taxable Subtotal:</span>
                    <span>${(invoice as any).taxable_subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Exempt Subtotal:</span>
                    <span>${(invoice as any).exempt_subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal?.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                // Show simple subtotal when all taxable or all exempt
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal?.toFixed(2)}</span>
                </div>
              )}

              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Total Tax:</span>
                  <span>${invoice.tax_amount?.toFixed(2)}</span>
                </div>
              )}

              {hasAnyExemptItems && invoice.tax_amount === 0 && (
                <div className="flex justify-between text-sm text-muted-foreground italic">
                  <span>Tax:</span>
                  <span>Exempt</span>
                </div>
              )}

              {invoice.late_fee_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Late Fee:</span>
                  <span>${invoice.late_fee_amount?.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>${invoice.total?.toFixed(2)}</span>
              </div>

              {invoice.amount_paid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid:</span>
                    <span>-${invoice.amount_paid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Amount Due:</span>
                    <span>${invoice.amount_due?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">${payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                        {payment.payment_method && ` • ${payment.payment_method}`}
                      </p>
                      {payment.transaction_id && (
                        <p className="text-xs text-muted-foreground">Ref: {payment.transaction_id}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <SaveAsTemplateButton id={invoice.id} type="invoice" />
              <Button asChild variant="outline" className="w-full sm:w-auto text-foreground">
                <Link href="/dashboard/invoices">Back to Invoices</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto text-foreground">
                <Link href={`/api/pdf/invoice/${invoice.id}`} target="_blank">
                  <Download className="h-4 w-4 mr-2" />
                  <span>PDF</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto text-foreground">
                <Link href={`/api/invoices/${invoice.id}/calendar`} download>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Add to Calendar</span>
                </Link>
              </Button>
              <Button asChild variant="default" className="w-full sm:w-auto">
                <Link href={`/dashboard/invoices/${invoice.id}/edit`}>Edit</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href={`/dashboard/invoices/${invoice.id}/payments`}>Record Payment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
