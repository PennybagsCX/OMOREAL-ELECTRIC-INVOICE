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
    <div className="container max-w-4xl py-8 px-4 pb-20 w-full overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 w-full overflow-x-hidden">
        <div className="flex items-center gap-2 w-full overflow-x-hidden">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4 w-full overflow-x-hidden" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold w-full overflow-x-hidden">{invoice.invoice_number}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground w-full overflow-x-hidden">
              {new Date(invoice.issue_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={statusColors[invoice.status] as any} className="shrink-0 w-full overflow-x-hidden">
          {invoice.status === 'paid' ? 'PAID' : invoice.status === 'partial' ? 'PARTIAL' : invoice.status === 'overdue' ? 'OVERDUE' : invoice.status}
        </Badge>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 w-full overflow-x-hidden">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Bill To</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold w-full overflow-x-hidden">{invoice.client?.name}</p>
            {invoice.client?.email && <p className="text-sm text-muted-foreground w-full overflow-x-hidden">{invoice.client.email}</p>}
            {invoice.client?.phone && <p className="text-sm text-muted-foreground w-full overflow-x-hidden">{invoice.client.phone}</p>}
            {invoice.client?.address && <p className="text-sm text-muted-foreground whitespace-pre-line w-full overflow-x-hidden">{invoice.client.address}</p>}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 w-full overflow-x-hidden">
            <div className="flex justify-between w-full overflow-x-hidden">
              <span className="text-muted-foreground w-full overflow-x-hidden">Issue Date:</span>
              <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between w-full overflow-x-hidden">
              <span className="text-muted-foreground w-full overflow-x-hidden">Due Date:</span>
              <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            {invoice.estimate_id && (
              <div className="flex justify-between w-full overflow-x-hidden">
                <span className="text-muted-foreground w-full overflow-x-hidden">Converted from Estimate:</span>
                <Link href={`/dashboard/estimates/${invoice.estimate_id}`} className="text-primary hover:underline w-full overflow-x-hidden">
                  View Estimate
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 w-full overflow-x-hidden">
              {invoice.line_items?.map((item: any) => {
                const itemTaxRate = (item as any).tax_rate ?? 13
                return (
                  <div key={item.id} className="flex justify-between items-start gap-4 py-2 border-b last:border-0 w-full overflow-x-hidden">
                    <div className="flex-1 min-w-0 w-full overflow-x-hidden">
                      <div className="flex items-center gap-2 flex-wrap w-full overflow-x-hidden">
                        <p className="font-medium w-full overflow-x-hidden">{item.description}</p>
                        {itemTaxRate === 0 && (
                          <Badge variant="secondary" className="text-xs w-full overflow-x-hidden">Tax Exempt</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground w-full overflow-x-hidden">
                        {item.quantity} {item.unit || ''} × ${item.rate.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold shrink-0 w-full overflow-x-hidden">${item.amount.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6 w-full overflow-x-hidden">
            <div className="space-y-2 w-full overflow-x-hidden">
              {hasMixedTax ? (
                // Show breakdown when mixed
                <>
                  <div className="flex justify-between text-sm w-full overflow-x-hidden">
                    <span>Taxable Subtotal:</span>
                    <span>${(invoice as any).taxable_subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground w-full overflow-x-hidden">
                    <span>Exempt Subtotal:</span>
                    <span>${(invoice as any).exempt_subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium w-full overflow-x-hidden">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal?.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                // Show simple subtotal when all taxable or all exempt
                <div className="flex justify-between text-sm w-full overflow-x-hidden">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal?.toFixed(2)}</span>
                </div>
              )}

              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-sm w-full overflow-x-hidden">
                  <span>Total Tax:</span>
                  <span>${invoice.tax_amount?.toFixed(2)}</span>
                </div>
              )}

              {hasAnyExemptItems && invoice.tax_amount === 0 && (
                <div className="flex justify-between text-sm text-muted-foreground italic w-full overflow-x-hidden">
                  <span>Tax:</span>
                  <span>Exempt</span>
                </div>
              )}

              {invoice.late_fee_amount > 0 && (
                <div className="flex justify-between text-sm w-full overflow-x-hidden">
                  <span>Late Fee:</span>
                  <span>${invoice.late_fee_amount?.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t w-full overflow-x-hidden">
                <span>Total:</span>
                <span>${invoice.total?.toFixed(2)}</span>
              </div>

              {invoice.amount_paid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600 w-full overflow-x-hidden">
                    <span>Amount Paid:</span>
                    <span>-${invoice.amount_paid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold w-full overflow-x-hidden">
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
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line w-full overflow-x-hidden">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 w-full overflow-x-hidden">
                {invoice.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center py-2 border-b last:border-0 w-full overflow-x-hidden">
                    <div>
                      <p className="font-medium w-full overflow-x-hidden">${payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground w-full overflow-x-hidden">
                        {new Date(payment.payment_date).toLocaleDateString()}
                        {payment.payment_method && ` • ${payment.payment_method}`}
                      </p>
                      {payment.transaction_id && (
                        <p className="text-xs text-muted-foreground w-full overflow-x-hidden">Ref: {payment.transaction_id}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="lg:col-span-2 w-full overflow-x-hidden">
          <CardContent className="pt-6 w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row gap-2 w-full overflow-x-hidden flex-wrap">
              <SaveAsTemplateButton id={invoice.id} type="invoice" />
              <Button asChild variant="outline" className="w-full sm:w-auto text-foreground w-full overflow-x-hidden">
                <Link href="/dashboard/invoices">Back to Invoices</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto text-foreground w-full overflow-x-hidden">
                <Link href={`/api/pdf/invoice/${invoice.id}`} target="_blank">
                  <Download className="h-4 w-4 mr-2 sm:inline hidden w-full overflow-x-hidden" />
                  <span className="hidden sm:inline w-full overflow-x-hidden">PDF</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto text-foreground w-full overflow-x-hidden">
                <Link href={`/api/invoices/${invoice.id}/calendar`} download>
                  <Calendar className="h-4 w-4 mr-2 sm:inline hidden w-full overflow-x-hidden" />
                  <span className="hidden sm:inline w-full overflow-x-hidden">Add to Calendar</span>
                </Link>
              </Button>
              <Button asChild variant="default" className="w-full sm:w-auto w-full overflow-x-hidden">
                <Link href={`/dashboard/invoices/${invoice.id}/edit`}>Edit</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full sm:w-auto w-full overflow-x-hidden">
                <Link href={`/dashboard/invoices/${invoice.id}/payments`}>Record Payment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
