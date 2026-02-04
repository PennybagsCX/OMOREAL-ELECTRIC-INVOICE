'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { LineItemsEditor } from '@/components/invoices/line-items-editor'
import { EstimateInvoiceTemplatePicker } from '@/components/shared/estimate-invoice-template-picker'
import { createInvoice } from '@/actions/invoices'
import { toast } from '@/hooks/use-toast'

interface Client {
  id: string
  name: string
  email: string | null
}

interface NewInvoiceFormProps {
  clients: Client[]
}

export default function NewInvoiceForm({ clients }: NewInvoiceFormProps) {
  const router = useRouter()
  const [lineItems, setLineItems] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const DEFAULT_TAX_RATE = 13

  // Handle template selection
  const handleSelectTemplate = (template: any) => {
    // Set line items from template
    setLineItems(template.line_items)
    // Set notes from template
    if (template.notes) {
      setNotes(template.notes)
    }
    // Set due_date based on template's due_date_days
    if (template.due_date_days) {
      const due = new Date()
      due.setDate(due.getDate() + template.due_date_days)
      setDueDate(due.toISOString().split('T')[0])
    }
  }

  async function handleSubmit(formData: FormData) {
    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      toast({ title: 'Error', description: 'Please add at least one line item', variant: 'destructive' })
      return
    }

    // Set notes from state
    if (notes) {
      formData.set('notes', notes)
    }
    // Set due_date from state if set
    if (dueDate) {
      formData.set('due_date', dueDate)
    }

    formData.append('lineItems', JSON.stringify(lineItems))

    try {
      await createInvoice(formData)
      toast({ title: 'Success', description: 'Invoice created!' })
      router.push('/dashboard/invoices')
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
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
          <CardTitle>Create New Invoice</CardTitle>
          <CardDescription>Fill in the invoice details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select name="client_id" required>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No clients found. <a href="/dashboard/clients/new" className="text-primary hover:underline">Create one first</a>.
                </p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Default is 30 days from today</p>
            </div>

            {/* Quick Start - Load from Template */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-base font-semibold">Quick Start</Label>
              <p className="text-sm text-muted-foreground mb-3">Load a template to pre-fill this invoice</p>
              <EstimateInvoiceTemplatePicker
                templateType="invoice"
                onSelect={handleSelectTemplate}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <Label>Line Items</Label>
              <LineItemsEditor
                onChange={setLineItems}
                value={lineItems}
                defaultTaxRate={DEFAULT_TAX_RATE}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Payment terms, thank you note, etc."
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

            <div className="flex gap-4">
              <Button type="submit" disabled={clients?.length === 0}>
                Create Invoice
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
