'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getEstimate, updateEstimate } from '@/actions/estimates'
import { getClients } from '@/actions/clients'
import { LineItemsEditor } from '@/components/estimates/line-items-editor'
import { toast } from '@/hooks/use-toast'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  tax_rate?: number
}

const DEFAULT_TAX_RATE = 13

export default function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [estimate, setEstimate] = useState<any>(null)
  const [estimateId, setEstimateId] = useState<string>('')

  useEffect(() => {
    params.then((p) => {
      setEstimateId(p.id)
      // Load estimate and clients
      Promise.all([
        getEstimate(p.id),
        getClients(),
      ]).then(([estData, clientsData]) => {
        setEstimate(estData)
        // Initialize line items with tax_rate
        const initialItems = (estData.line_items || []).map((item: any) => ({
          id: crypto.randomUUID(),
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || '',
          rate: item.rate,
          amount: item.amount,
          tax_rate: (item as any).tax_rate ?? DEFAULT_TAX_RATE,
        }))
        setLineItems(initialItems)
        setClients(clientsData || [])
      }).catch(console.error)
    })
  }, [params])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      formData.append('lineItems', JSON.stringify(lineItems))
      await updateEstimate(estimateId, formData)
      toast({ title: 'Success', description: 'Estimate updated!' })
      router.push(`/dashboard/estimates/${estimateId}`)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals with per-line-item tax
  const taxableSubtotal = lineItems.reduce((sum, item) => {
    const taxRate = item.tax_rate ?? DEFAULT_TAX_RATE
    if (taxRate > 0) {
      return sum + item.amount
    }
    return sum
  }, 0)

  const exemptSubtotal = lineItems.reduce((sum, item) => {
    const taxRate = item.tax_rate ?? DEFAULT_TAX_RATE
    if (taxRate === 0) {
      return sum + item.amount
    }
    return sum
  }, 0)

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)

  const totalTax = lineItems.reduce((sum, item) => {
    const taxRate = item.tax_rate ?? DEFAULT_TAX_RATE
    if (taxRate > 0) {
      return sum + (item.amount * (taxRate / 100))
    }
    return sum
  }, 0)

  const total = subtotal + totalTax

  if (!estimate) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-4xl py-8 px-4 w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Edit Estimate</CardTitle>
          <CardDescription>Update estimate for {estimate.client?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6 w-full overflow-x-hidden">
            <div className="grid gap-4 md:grid-cols-2 w-full overflow-x-hidden">
              <div className="space-y-2 w-full overflow-x-hidden">
                <Label htmlFor="client_id">Client *</Label>
                <Select name="client_id" defaultValue={estimate.client_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full overflow-x-hidden">
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  defaultValue={estimate.valid_until}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Line Items</Label>
              <LineItemsEditor
                value={lineItems}
                onChange={setLineItems}
                defaultTaxRate={DEFAULT_TAX_RATE}
              />
            </div>

            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes..."
                defaultValue={estimate.notes || ''}
              />
            </div>

            {/* Totals Summary */}
            <Card>
              <CardContent className="pt-6 w-full overflow-x-hidden">
                <div className="space-y-2 w-full overflow-x-hidden">
                  {taxableSubtotal > 0 && exemptSubtotal > 0 ? (
                    // Show breakdown when mixed
                    <>
                      <div className="flex justify-between text-sm w-full overflow-x-hidden">
                        <span>Taxable Subtotal:</span>
                        <span>${taxableSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground w-full overflow-x-hidden">
                        <span>Exempt Subtotal:</span>
                        <span>${exemptSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium w-full overflow-x-hidden">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    // Show simple subtotal when all taxable or all exempt
                    <div className="flex justify-between text-sm w-full overflow-x-hidden">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  )}

                  {totalTax > 0 && (
                    <div className="flex justify-between text-sm w-full overflow-x-hidden">
                      <span>Total Tax:</span>
                      <span>${totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  {exemptSubtotal > 0 && taxableSubtotal === 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground italic w-full overflow-x-hidden">
                      <span>Tax:</span>
                      <span>Exempt</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-2 border-t w-full overflow-x-hidden">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full w-full overflow-x-hidden">
              {loading ? 'Updating...' : 'Update Estimate'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
