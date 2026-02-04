'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { LineItemsEditor } from '@/components/estimates/line-items-editor'
import { createTemplate } from '@/actions/estimate-invoice-templates'
import { toast } from '@/hooks/use-toast'

interface TemplateFormDialogProps {
  trigger?: React.ReactNode
  type?: 'estimate' | 'invoice'
  onSuccess?: () => void
}

const DEFAULT_TAX_RATE = 13

export function TemplateFormDialog({ trigger, type = 'estimate', onSuccess }: TemplateFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [templateType, setTemplateType] = useState<'estimate' | 'invoice'>(type)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [daysOffset, setDaysOffset] = useState(30)
  const [lineItems, setLineItems] = useState<any[]>([])

  const resetForm = () => {
    setName('')
    setDescription('')
    setNotes('')
    setDaysOffset(30)
    setLineItems([])
    setTemplateType(type)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' })
      return
    }

    if (lineItems.length === 0 || lineItems.every((item) => !item.description)) {
      toast({ title: 'Error', description: 'Please add at least one line item', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      await createTemplate({
        template_type: templateType,
        name,
        description: description || undefined,
        notes: notes || undefined,
        [templateType === 'invoice' ? 'due_date_days' : 'valid_until_days']: daysOffset,
        line_items: lineItems,
      })
      toast({ title: 'Success', description: 'Template created!' })
      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create template', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Create a reusable {templateType} template that you can use when creating new {templateType}s.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Type */}
          {!type && (
            <div className="space-y-2">
              <Label>Template Type *</Label>
              <Select value={templateType} onValueChange={(v: 'estimate' | 'invoice') => setTemplateType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Residential Service Call"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Brief description of this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Days Offset */}
          <div className="space-y-2">
            <Label htmlFor="days-offset">
              {templateType === 'invoice' ? 'Due Date Days' : 'Valid Until Days'} *
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="days-offset"
                type="number"
                min={1}
                max={365}
                value={daysOffset}
                onChange={(e) => setDaysOffset(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                {templateType === 'invoice'
                  ? 'Days from issue date that payment is due'
                  : 'Days from creation until estimate expires'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="template-notes">Notes (Optional)</Label>
            <Textarea
              id="template-notes"
              placeholder="Default notes to include on {templateType}s..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Line Items *</Label>
              <Badge variant="secondary">Add items below</Badge>
            </div>
            <LineItemsEditor value={lineItems} onChange={setLineItems} defaultTaxRate={DEFAULT_TAX_RATE} />
          </div>

          {/* Totals Preview */}
          {lineItems.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-3">Template Totals Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>
                    ${lineItems.reduce((sum, item) => {
                      const taxRate = item.tax_rate ?? DEFAULT_TAX_RATE
                      if (taxRate > 0) {
                        return sum + (item.amount * (taxRate / 100))
                      }
                      return sum
                    }, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    ${(
                      lineItems.reduce((sum, item) => sum + item.amount, 0) +
                      lineItems.reduce((sum, item) => {
                        const taxRate = item.tax_rate ?? DEFAULT_TAX_RATE
                        if (taxRate > 0) {
                          return sum + (item.amount * (taxRate / 100))
                        }
                        return sum
                      }, 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
