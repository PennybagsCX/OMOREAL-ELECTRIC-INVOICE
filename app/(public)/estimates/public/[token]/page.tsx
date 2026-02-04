import { getEstimateByToken, acceptEstimate } from '@/actions/estimates'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const estimate = await getEstimateByToken(token)

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">This estimate link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const business = estimate.business

  async function handleAccept() {
    'use server'
    await acceptEstimate(token)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            {business?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt="Logo" className="h-16 mb-4" />
            )}
            <h1 className="text-2xl font-bold">{business?.name || 'Estimate'}</h1>
            {business?.address && <p className="text-sm text-muted-foreground">{business.address}</p>}
            {business?.phone && <p className="text-sm text-muted-foreground">{business.phone}</p>}
            {business?.email && <p className="text-sm text-muted-foreground">{business.email}</p>}
          </CardContent>
        </Card>

        {/* Estimate Details */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Estimate</p>
                <p className="text-xl font-bold">{estimate.estimate_number}</p>
              </div>
              <Badge variant={estimate.status === 'accepted' ? 'default' : 'secondary'}>
                {estimate.status}
              </Badge>
            </div>

            <div className="grid gap-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-medium">{estimate.client?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Valid Until:</span>
                <span className="font-medium">
                  {new Date(estimate.valid_until).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 mb-4">
              {estimate.line_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} {item.unit} × ${item.rate}
                    </p>
                  </div>
                  <p className="font-medium">${item.amount?.toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${estimate.subtotal?.toFixed(2)}</span>
              </div>
              {estimate.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({estimate.tax_rate}%):</span>
                  <span>${estimate.tax_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${estimate.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Accept Button */}
            {estimate.status !== 'accepted' && estimate.status !== 'rejected' && (
              <form action={handleAccept} className="mt-4">
                <Button type="submit" size="lg" className="w-full">
                  Accept Estimate
                </Button>
              </form>
            )}

            {estimate.status === 'accepted' && (
              <p className="text-center text-green-600 font-medium mt-4">
                ✓ Estimate Accepted
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
