'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, GripVertical, Star } from 'lucide-react'
import { SavedLineItemsPicker, LineItemData } from '@/components/shared/saved-line-items-picker'
import { saveLineItemFromForm } from '@/actions/saved-line-items'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  tax_rate?: number
}

interface LineItemsEditorProps {
  value: LineItem[]
  onChange: (items: LineItem[]) => void
  defaultTaxRate?: number
}

export function LineItemsEditor({ value, onChange, defaultTaxRate = 13 }: LineItemsEditorProps) {
  const [savingId, setSavingId] = useState<string | null>(null)

  const updateItem = (index: number, field: keyof LineItem, fieldValue: any) => {
    const newItems = [...value]
    const item = { ...newItems[index] }

    if (field === 'quantity' || field === 'rate' || field === 'tax_rate') {
      (item as any)[field] = Number(fieldValue)
      item.amount = item.quantity * item.rate
    } else {
      (item as any)[field] = fieldValue
    }

    newItems[index] = item
    onChange(newItems)
  }

  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: '',
      rate: 0,
      amount: 0,
      tax_rate: defaultTaxRate,
    }
    onChange([...value, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index)
    onChange(newItems)
  }

  const handleSelectSavedItem = (selectedItem: LineItemData, index?: number) => {
    if (index !== undefined) {
      // Update existing item
      const newItems = [...value]
      newItems[index] = {
        ...newItems[index],
        description: selectedItem.description,
        quantity: selectedItem.quantity,
        unit: selectedItem.unit,
        rate: selectedItem.rate,
        tax_rate: selectedItem.tax_rate ?? defaultTaxRate,
        amount: selectedItem.quantity * selectedItem.rate,
      }
      onChange(newItems)
    } else {
      // Add as new item
      const newItem: LineItem = {
        id: Date.now().toString(),
        description: selectedItem.description,
        quantity: selectedItem.quantity,
        unit: selectedItem.unit,
        rate: selectedItem.rate,
        tax_rate: selectedItem.tax_rate ?? defaultTaxRate,
        amount: selectedItem.quantity * selectedItem.rate,
      }
      onChange([...value, newItem])
    }
  }

  const handleSaveAsTemplate = async (index: number) => {
    const item = value[index]
    if (!item.description) return

    setSavingId(item.id)
    try {
      const name = prompt('Save as template with name:', item.description.substring(0, 50))
      if (!name) return

      const category = prompt('Category (optional):', '')

      await saveLineItemFromForm({
        name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        tax_rate: item.tax_rate,
        category: category || undefined,
      })

      alert('Template saved!')
    } catch (error: any) {
      alert('Error saving template: ' + error.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-3 w-full overflow-x-hidden">
      {value.map((item: LineItem, index: number) => (
        <Card key={item.id || index} className={item.tax_rate === 0 ? 'border-muted-foreground/50 bg-muted/30' : ''}>
          <CardContent className="pt-4">
            <div className="grid gap-3">
              <div className="flex gap-2">
                <GripVertical className="mt-2 h-5 w-5 text-muted-foreground cursor-move shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  {/* Saved items picker for empty description */}
                  {(!item.description || item.description === '') && (
                    <div className="mb-2">
                      <Label>Quick Add from Templates</Label>
                      <SavedLineItemsPicker
                        onSelect={(selectedItem) => handleSelectSavedItem(selectedItem, index)}
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`desc-${index}`}>Description</Label>
                      {item.tax_rate === 0 && (
                        <Badge variant="secondary" className="text-xs">Tax Exempt</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        id={`desc-${index}`}
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Labor, materials, etc."
                        rows={2}
                        className="resize-none flex-1"
                      />
                      {item.description && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleSaveAsTemplate(index)}
                          disabled={savingId === item.id}
                          title="Save as template"
                          className="shrink-0"
                        >
                          <Star className={`h-4 w-4 ${savingId === item.id ? 'fill-yellow-400' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <Label htmlFor={`qty-${index}`}>Qty</Label>
                      <Input
                        id={`qty-${index}`}
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`unit-${index}`}>Unit</Label>
                      <Input
                        id={`unit-${index}`}
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="hrs, ea"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`rate-${index}`}>Rate</Label>
                      <Input
                        id={`rate-${index}`}
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`tax-${index}`}>Tax %</Label>
                      <Input
                        id={`tax-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.tax_rate ?? defaultTaxRate}
                        onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                        className={item.tax_rate === 0 ? 'bg-muted-foreground/10' : ''}
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`amt-${index}`}>Amount</Label>
                        <Input
                          id={`amt-${index}`}
                          value={`$${item.amount.toFixed(2)}`}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addItem} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          Add Line Item
        </Button>
        <SavedLineItemsPicker
          onSelect={(selectedItem) => handleSelectSavedItem(selectedItem)}
        />
      </div>
    </div>
  )
}
