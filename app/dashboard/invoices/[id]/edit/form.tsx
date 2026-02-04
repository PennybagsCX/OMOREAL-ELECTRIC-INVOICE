'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
import { updateInvoice, deleteInvoice } from '@/actions/invoices'
import { toast } from '@/hooks/use-toast'

interface Client {
  id: string
  name: string
  email: string | null
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  tax_rate?: number
}

interface Invoice {
  id: string
  client_id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string
  notes: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  client: {
    id: string
    name: string
  }
  line_items: LineItem[]
}

interface EditInvoiceFormProps {
  invoice: Invoice
  clients: Client[]
}

export default function EditInvoiceForm({ invoice, clients }: EditInvoiceFormProps) {
  const router = useRouter()
  const [lineItems, setLineItems] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const DEFAULT_TAX_RATE = 13

  useEffect(() => {
    // Initialize line items from invoice, preserving tax_rate if available
    const initialItems = invoice.line_items.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || '',
      rate: item.rate,
      amount: item.amount,
      tax_rate: (item as any).tax_rate ?? DEFAULT_TAX_RATE,
    }))
    setLineItems(initialItems)
  }, [invoice])

  async function handleSubmit(formData: FormData) {
    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      toast({ title: 'Error', description: 'Please add at least one line item', variant: 'destructive' })
      return
    }

    formData.append('lineItems', JSON.stringify(lineItems))

    try {
      await updateInvoice(invoice.id, formData)
      toast({ title: 'Success', description: 'Invoice updated!' })
      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteInvoice(invoice.id)
      toast({ title: 'Success', description: 'Invoice deleted!' })
      router.push('/dashboard/invoices')
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setIsDeleting(false)
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
          <CardTitle>Edit Invoice {invoice.invoice_number}</CardTitle>
          <CardDescription>Update the invoice details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6 w-full overflow-x-hidden">
            {/* Client Selection */}
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="client">Client *</Label>
              <Select name="client_id" defaultValue={invoice.client_id} required>
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
            </div>

            {/* Due Date */}
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={invoice.due_date}
                required
              />
            </div>

            {/* Line Items */}
            <LineItemsEditor
              value={lineItems}
              onChange={setLineItems}
              defaultTaxRate={DEFAULT_TAX_RATE}
            />

            {/* Notes */}
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={invoice.notes || ''}
                placeholder="Payment terms, thank you note, etc."
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

            <div className="flex gap-4 w-full overflow-x-hidden">
              <Button type="submit">
                Update Invoice
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Invoice'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
