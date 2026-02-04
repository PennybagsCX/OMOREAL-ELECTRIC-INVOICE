import { getEstimate } from '@/actions/estimates'
import { convertEstimateToInvoice } from '@/actions/invoices'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ConvertEstimatePage({
  params,
}: {
  params: Promise<{ estimateId: string }>
}) {
  const { estimateId } = await params
  const estimate = await getEstimate(estimateId)

  if (!estimate) {
    return <div>Estimate not found</div>
  }

  async function handleConvert() {
    'use server'
    const invoice = await convertEstimateToInvoice(estimateId)
    redirect(`/dashboard/invoices/${invoice.id}`)
  }

  return (
    <div className="container max-w-2xl py-8 px-4 w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Convert Estimate to Invoice</CardTitle>
          <CardDescription>Review the estimate before converting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 w-full overflow-x-hidden">
          <div>
            <p className="text-sm text-muted-foreground w-full overflow-x-hidden">Estimate</p>
            <p className="font-semibold w-full overflow-x-hidden">{estimate.estimate_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground w-full overflow-x-hidden">Client</p>
            <p className="font-semibold w-full overflow-x-hidden">{estimate.client?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground w-full overflow-x-hidden">Total</p>
            <p className="font-semibold text-2xl w-full overflow-x-hidden">${estimate.total?.toFixed(2)}</p>
          </div>

          {estimate.line_items && estimate.line_items.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 w-full overflow-x-hidden">Line Items</p>
              <div className="space-y-1 w-full overflow-x-hidden">
                {estimate.line_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm w-full overflow-x-hidden">
                    <span>{item.description}</span>
                    <span>${item.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form action={handleConvert}>
            <Button type="submit" className="w-full w-full overflow-x-hidden" size="lg">
              Convert to Invoice
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
