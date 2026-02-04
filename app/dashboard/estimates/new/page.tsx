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
import { DatePicker } from '@/components/ui/date-picker'
import { getClients } from '@/actions/clients'
import { createEstimate } from '@/actions/estimates'
import { LineItemsEditor } from '@/components/estimates/line-items-editor'
import { EstimateInvoiceTemplatePicker } from '@/components/shared/estimate-invoice-template-picker'
import { toast } from '@/hooks/use-toast'

interface Client {
  id: string
  name: string
}

const DEFAULT_TAX_RATE = 13

export default function NewEstimatePage() {
  const router = useRouter()
  const [lineItems, setLineItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [validUntil, setValidUntil] = useState<Date | undefined>()
  const [notes, setNotes] = useState('')

  useEffect(() => {
    // Load clients
    getClients().then(setClients).catch(console.error)
  }, [])

  // Handle template selection
  const handleSelectTemplate = (template: any) => {
    // Set line items from template
    setLineItems(template.line_items)
    // Set notes from template
    if (template.notes) {
      setNotes(template.notes)
    }
    // Set valid_until based on template's valid_until_days
    if (template.valid_until_days) {
      const validDate = new Date()
      validDate.setDate(validDate.getDate() + template.valid_until_days)
      setValidUntil(validDate)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validUntil) {
      toast({ title: 'Error', description: 'Please select a valid until date', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      const form = e.currentTarget
      formData.append('client_id', (form.querySelector('[name="client_id"]') as HTMLSelectElement)?.value || '')
      formData.append('valid_until', validUntil.toISOString().split('T')[0])
      formData.append('notes', notes || '')
      formData.append('lineItems', JSON.stringify(lineItems))

      await createEstimate(formData)
      toast({ title: 'Success', description: 'Estimate created!' })
      router.push('/dashboard/estimates')
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

  return (
    <div className="container max-w-4xl py-8 px-4 w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>New Estimate</CardTitle>
          <CardDescription>Create an estimate for a client</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select name="client_id" required>
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
              <div className="space-y-2">
                <Label>Valid Until *</Label>
                <DatePicker
                  value={validUntil}
                  onChange={setValidUntil}
                  placeholder="Select a date"
                  required
                />
              </div>
            </div>

            {/* Quick Start - Load from Template */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-base font-semibold">Quick Start</Label>
              <p className="text-sm text-muted-foreground mb-3">Load a template to pre-fill this estimate</p>
              <EstimateInvoiceTemplatePicker
                templateType="estimate"
                onSelect={handleSelectTemplate}
              />
            </div>

            <div>
              <Label>Line Items</Label>
              <LineItemsEditor value={lineItems} onChange={setLineItems} defaultTaxRate={DEFAULT_TAX_RATE} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Totals Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {taxableSubtotal > 0 && exemptSubtotal > 0 ? (
                    // Show breakdown when mixed
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Taxable Subtotal:</span>
                        <span>${taxableSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Exempt Subtotal:</span>
                        <span>${exemptSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    // Show simple subtotal when all taxable or all exempt
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  )}

                  {totalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Total Tax:</span>
                      <span>${totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  {exemptSubtotal > 0 && taxableSubtotal === 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground italic">
                      <span>Tax:</span>
                      <span>Exempt</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea id="internal_notes" name="internal_notes" placeholder="Private notes (not visible to client)..." />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Estimate'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
