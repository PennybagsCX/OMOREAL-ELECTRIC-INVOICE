import { getEstimate } from '@/actions/estimates'
import {
  deleteEstimateAndRevalidate,
  updateEstimateStatusAndRevalidate,
  generateEstimateTokenAndRevalidate,
  convertEstimateToInvoiceWithRedirect,
} from '@/actions/estimates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Download, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ShareButton } from '@/components/estimates/share-button'
import { SaveAsTemplateButton } from '@/components/shared/save-as-template-button'

const statusColors: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  viewed: 'outline',
  accepted: 'default',
  expired: 'destructive',
  rejected: 'destructive',
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const estimate = await getEstimate(id)

  if (!estimate) {
    return <div>Estimate not found</div>
  }

  // Check if there are mixed tax rates
  const hasMixedTax = (estimate as any).taxable_subtotal > 0 && (estimate as any).exempt_subtotal > 0
  const hasAnyExemptItems = estimate.line_items?.some((item: any) => (item as any).tax_rate === 0)

  return (
    <div className="container max-w-4xl py-8 px-4 w-full overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6 w-full overflow-x-hidden">
        <Button variant="ghost" size="icon" asChild className="sm:self-auto w-full overflow-x-hidden">
          <Link href="/dashboard/estimates">
            <ArrowLeft className="h-4 w-4 w-full overflow-x-hidden" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 flex-1 w-full overflow-x-hidden">
          <h1 className="text-xl sm:text-2xl font-bold w-full overflow-x-hidden">{estimate.estimate_number}</h1>
          <Badge variant={statusColors[estimate.status] as any} className="shrink-0 w-full overflow-x-hidden">
            {estimate.status}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full overflow-x-hidden">
            <div className="flex-1 w-full overflow-x-hidden">
              <CardTitle className="text-lg sm:text-xl w-full overflow-x-hidden">{estimate.client?.name || 'No client'}</CardTitle>
              <CardDescription className="text-sm w-full overflow-x-hidden">
                Valid until: {new Date(estimate.valid_until).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto w-full overflow-x-hidden">
              <SaveAsTemplateButton id={estimate.id} type="estimate" />
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none text-foreground w-full overflow-x-hidden">
                <Link href={`/dashboard/estimates/${estimate.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2 sm:inline hidden w-full overflow-x-hidden" />
                  <span className="hidden sm:inline w-full overflow-x-hidden">Edit</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none text-foreground w-full overflow-x-hidden">
                <Link href={`/api/pdf/estimate/${estimate.id}`} target="_blank">
                  <Download className="h-4 w-4 mr-2 sm:inline hidden w-full overflow-x-hidden" />
                  <span className="hidden sm:inline w-full overflow-x-hidden">PDF</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none text-foreground w-full overflow-x-hidden">
                <Link href={`/api/estimates/${estimate.id}/calendar`} download>
                  <Calendar className="h-4 w-4 mr-2 sm:inline hidden w-full overflow-x-hidden" />
                  <span className="hidden sm:inline w-full overflow-x-hidden">Calendar</span>
                </Link>
              </Button>
              <form action={deleteEstimateAndRevalidate} className="flex-1 sm:flex-none w-full overflow-x-hidden">
                <input type="hidden" name="id" value={estimate.id} />
                <Button variant="destructive" size="sm" type="submit" className="w-full w-full overflow-x-hidden">
                  <Trash2 className="h-4 w-4 mr-2 hidden sm:inline w-full overflow-x-hidden" />
                  Delete
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 w-full overflow-x-hidden">
          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-3 w-full overflow-x-hidden">Line Items</h3>
            <div className="space-y-2 w-full overflow-x-hidden">
              {estimate.line_items?.map((item: any) => {
                const itemTaxRate = (item as any).tax_rate ?? 13
                return (
                  <div key={item.id} className="p-3 bg-muted rounded w-full overflow-x-hidden">
                    <div className="flex justify-between items-start gap-2 mb-2 w-full overflow-x-hidden">
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
                      <p className="font-semibold text-sm sm:text-base shrink-0 w-full overflow-x-hidden">${item.amount.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4 w-full overflow-x-hidden">
            {hasMixedTax ? (
              // Show breakdown when mixed
              <>
                <div className="flex justify-between text-sm w-full overflow-x-hidden">
                  <span>Taxable Subtotal:</span>
                  <span className="font-medium w-full overflow-x-hidden">${(estimate as any).taxable_subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground w-full overflow-x-hidden">
                  <span>Exempt Subtotal:</span>
                  <span>${(estimate as any).exempt_subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm w-full overflow-x-hidden">
                  <span>Subtotal:</span>
                  <span className="font-medium w-full overflow-x-hidden">${estimate.subtotal?.toFixed(2)}</span>
                </div>
              </>
            ) : (
              // Show simple subtotal when all taxable or all exempt
              <div className="flex justify-between text-sm w-full overflow-x-hidden">
                <span>Subtotal:</span>
                <span className="font-medium w-full overflow-x-hidden">${estimate.subtotal?.toFixed(2)}</span>
              </div>
            )}

            {estimate.tax_amount > 0 && (
              <div className="flex justify-between text-sm w-full overflow-x-hidden">
                <span>Total Tax:</span>
                <span className="font-medium w-full overflow-x-hidden">${estimate.tax_amount?.toFixed(2)}</span>
              </div>
            )}

            {hasAnyExemptItems && estimate.tax_amount === 0 && (
              <div className="flex justify-between text-sm text-muted-foreground italic w-full overflow-x-hidden">
                <span>Tax:</span>
                <span>Exempt</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold pt-2 border-t w-full overflow-x-hidden">
              <span>Total:</span>
              <span>${estimate.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div className="border-t pt-4 w-full overflow-x-hidden">
              <h3 className="font-semibold mb-2 w-full overflow-x-hidden">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap w-full overflow-x-hidden">{estimate.notes}</p>
            </div>
          )}

          {/* Share */}
          <div className="border-t pt-4 w-full overflow-x-hidden">
            <h3 className="font-semibold mb-3 w-full overflow-x-hidden">Share</h3>
            <ShareButton
              estimateId={estimate.id}
              publicToken={estimate.public_token}
              onGenerate={generateEstimateTokenAndRevalidate}
            />
          </div>

          {/* Status Actions */}
          <div className="border-t pt-4 w-full overflow-x-hidden">
            <h3 className="font-semibold mb-3 w-full overflow-x-hidden">Update Status</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full overflow-x-hidden">
              {estimate.status === 'draft' && (
                <form action={updateEstimateStatusAndRevalidate} className="w-full sm:w-auto w-full overflow-x-hidden">
                  <input type="hidden" name="id" value={estimate.id} />
                  <input type="hidden" name="status" value="sent" />
                  <Button type="submit" variant="outline" className="w-full w-full overflow-x-hidden">Mark as Sent</Button>
                </form>
              )}
              {estimate.status === 'sent' && (
                <form action={updateEstimateStatusAndRevalidate} className="w-full sm:w-auto w-full overflow-x-hidden">
                  <input type="hidden" name="id" value={estimate.id} />
                  <input type="hidden" name="status" value="viewed" />
                  <Button type="submit" variant="outline" className="w-full w-full overflow-x-hidden">Mark as Viewed</Button>
                </form>
              )}
              {(estimate.status === 'sent' || estimate.status === 'viewed') && (
                <div className="flex flex-col sm:flex-row gap-2 w-full w-full overflow-x-hidden">
                  <form action={updateEstimateStatusAndRevalidate} className="w-full sm:w-auto w-full overflow-x-hidden">
                    <input type="hidden" name="id" value={estimate.id} />
                    <input type="hidden" name="status" value="accepted" />
                    <Button type="submit" variant="default" className="w-full w-full overflow-x-hidden">Mark as Accepted</Button>
                  </form>
                  <form action={updateEstimateStatusAndRevalidate} className="w-full sm:w-auto w-full overflow-x-hidden">
                    <input type="hidden" name="id" value={estimate.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <Button type="submit" variant="destructive" className="w-full w-full overflow-x-hidden">Mark as Rejected</Button>
                  </form>
                </div>
              )}
              {estimate.status === 'accepted' && (
                <form action={convertEstimateToInvoiceWithRedirect} className="w-full w-full overflow-x-hidden">
                  <input type="hidden" name="id" value={estimate.id} />
                  <Button type="submit">
                    Convert to Invoice
                  </Button>
                </form>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
