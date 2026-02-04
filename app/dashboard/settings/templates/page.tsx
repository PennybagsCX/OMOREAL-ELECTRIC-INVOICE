'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Search, Trash2, Clock, Receipt, Edit, FileText, Layers, Star } from 'lucide-react'
import Link from 'next/link'
import { getTemplates, deleteTemplate, type Template } from '@/actions/estimate-invoice-templates'
import { getSavedLineItems, deleteSavedLineItem, type SavedLineItem as SavedLineItemData } from '@/actions/saved-line-items'
import { toast } from '@/hooks/use-toast'
import { LineItemsEditor } from '@/components/estimates/line-items-editor'
import { EstimateInvoiceTemplatePicker } from '@/components/shared/estimate-invoice-template-picker'
import { SavedLineItemsPicker } from '@/components/shared/saved-line-items-picker'
import { TemplateFormDialog } from '@/components/templates/template-form-dialog'

const DEFAULT_TAX_RATE = 13

// Local type matching LineItemsEditor's LineItem interface
interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  tax_rate?: number
}

type TemplateType = 'all' | 'estimate' | 'invoice'
type TabValue = 'document-templates' | 'saved-line-items'

export default function TemplatesManagementPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('document-templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [savedLineItems, setSavedLineItems] = useState<SavedLineItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TemplateType>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: 'template' | 'lineitem', data: any} | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{type: 'template' | 'lineitem', data: any} | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab, typeFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'document-templates') {
        const data = await getTemplates({
          type: typeFilter === 'all' ? 'both' : typeFilter,
          activeOnly: false,
        })
        setTemplates(data)
      } else {
        const data = await getSavedLineItems({
          sortBy: 'use_count',
          activeOnly: true,
        })
        setSavedLineItems(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      template.name.toLowerCase().includes(searchLower) ||
      (template.description && template.description.toLowerCase().includes(searchLower))
    )
  })

  const filteredLineItems = savedLineItems.filter((item) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      (item.category && item.category.toLowerCase().includes(searchLower))
    )
  })

  const handleDelete = async () => {
    if (!itemToDelete) return

    setLoading(true)
    try {
      if (itemToDelete.type === 'template') {
        await deleteTemplate(itemToDelete.data.id)
      } else {
        await deleteSavedLineItem(itemToDelete.data.id)
      }
      toast({ title: 'Success', description: 'Item deleted' })
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (type: 'template' | 'lineitem', data: any) => {
    setItemToDelete({ type, data })
    setDeleteDialogOpen(true)
  }

  const openEditDialog = (type: 'template' | 'lineitem', data: any) => {
    setEditingItem({ type, data })
    setEditDialogOpen(true)
  }

  return (
    <div className="container py-8 px-4 w-full overflow-x-hidden max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 w-full overflow-x-hidden">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">Manage your templates and saved items</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('document-templates')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'document-templates'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4 inline mr-2" />
          Document Templates
          {activeTab === 'document-templates' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('saved-line-items')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'saved-line-items'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="h-4 w-4 inline mr-2" />
          Saved Line Items
          {activeTab === 'saved-line-items' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Document Templates Tab */}
      {activeTab === 'document-templates' && (
        <>
          {/* Create Template Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <TemplateFormDialog type="estimate" trigger={
              <Button variant="default" className="w-full sm:w-auto sm:flex-none">
                <Plus className="h-4 w-4 mr-2 shrink-0" />
                New Estimate Template
              </Button>
            } />
            <TemplateFormDialog type="invoice" trigger={
              <Button variant="default" className="w-full sm:w-auto sm:flex-none">
                <Plus className="h-4 w-4 mr-2 shrink-0" />
                New Invoice Template
              </Button>
            } />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v: TemplateType) => setTypeFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="estimate">Estimates</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {search || typeFilter !== 'all'
                    ? 'Try adjusting your filters or search term'
                    : 'Create your first template using the buttons above'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{template.name}</CardTitle>
                        <CardDescription className="truncate mt-1">
                          {template.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant={template.template_type === 'estimate' ? 'default' : 'secondary'}>
                        {template.template_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Items:</span>
                        <span>{template.line_items_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold">${template.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Used:
                        </span>
                        <span>{template.use_count}x</span>
                      </div>
                      {template.last_used_at && (
                        <div className="text-xs text-muted-foreground">
                          Last used: {new Date(template.last_used_at).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 min-w-[60px]" asChild>
                          <Link href={
                            template.template_type === 'estimate'
                              ? `/dashboard/estimates/new`
                              : `/dashboard/invoices/new`
                          }>
                            Use
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog('template', template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog('template', template)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Saved Line Items Tab */}
      {activeTab === 'saved-line-items' && (
        <>
          {/* Create Line Item Button */}
          <div className="mb-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Saved Line Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create Saved Line Item</DialogTitle>
                  <DialogDescription>
                    Save a line item as a reusable template for quick access
                  </DialogDescription>
                </DialogHeader>
                <LineItemTemplateForm
                  onSave={() => {
                    loadData()
                    // Close dialog by finding and clicking the close button or triggering state
                  }}
                  onCancel={() => {
                    // Close dialog
                    const closeButton = document.querySelector('[data-state="closed"]') as HTMLButtonElement
                    closeButton?.click()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Saved Line Items Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredLineItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No saved line items found</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {search
                    ? 'Try adjusting your search term'
                    : 'Create your first saved line item using the button above'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLineItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {item.description}
                        </p>
                        {item.category && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-semibold shrink-0">
                        ${(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-3">
                      <span>{item.quantity} {item.unit || 'ea'} @ ${item.rate.toFixed(2)}</span>
                      {item.tax_rate === 0 && (
                        <Badge variant="outline" className="text-xs">Tax Exempt</Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground mb-3">
                      <span>Used {item.use_count}x</span>
                      {item.last_used_at && (
                        <span>Last: {new Date(item.last_used_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" onClick={() => openEditDialog('lineitem', item)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" onClick={() => openDeleteDialog('lineitem', item)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{itemToDelete?.data?.name || itemToDelete?.data?.description || 'this item'}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update the template details</DialogDescription>
          </DialogHeader>
          {editingItem?.type === 'template' ? (
            <TemplateEditForm
              template={editingItem.data}
              onSave={() => {
                setEditDialogOpen(false)
                setEditingItem(null)
                loadData()
              }}
              onCancel={() => {
                setEditDialogOpen(false)
                setEditingItem(null)
              }}
            />
          ) : editingItem?.type === 'lineitem' ? (
            <LineItemEditForm
              item={editingItem.data}
              onSave={() => {
                setEditDialogOpen(false)
                setEditingItem(null)
                loadData()
              }}
              onCancel={() => {
                setEditDialogOpen(false)
                setEditingItem(null)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Line Item Template Form for Dialog
function LineItemTemplateForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('')
  const [rate, setRate] = useState(0)
  const [taxRate, setTaxRate] = useState(13)

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Description is required', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { saveLineItemFromForm } = await import('@/actions/saved-line-items')
      await saveLineItemFromForm({
        name,
        description,
        category: category || undefined,
        quantity,
        unit,
        rate,
        tax_rate: taxRate,
      })
      toast({ title: 'Success', description: 'Line item saved!' })
      onSave()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-name">Name *</Label>
          <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-category">Category</Label>
          <Input id="item-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Labor, Materials" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="item-description">Description *</Label>
        <Textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this line item for?"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-quantity">Quantity</Label>
          <Input
            id="item-quantity"
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-unit">Unit</Label>
          <Input
            id="item-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="hrs, ea, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-rate">Rate</Label>
          <Input
            id="item-rate"
            type="number"
            min="0"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-tax">Tax %</Label>
          <Input
            id="item-tax"
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  )
}

// Template Edit Form (reused from inline)
function TemplateEditForm({
  template,
  onSave,
  onCancel,
}: {
  template: Template
  onSave: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || '')
  const [notes, setNotes] = useState(template.notes || '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    (template.line_items || []).map((item: any) => ({
      id: item.id,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit || '',
      rate: item.rate,
      amount: item.amount,
      tax_rate: item.tax_rate ?? DEFAULT_TAX_RATE,
    }))
  )

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { updateTemplate } = await import('@/actions/estimate-invoice-templates')
      // Ensure all line items have required tax_rate for TemplateLineItem type
      const templateLineItems = lineItems.map(item => ({
        ...item,
        tax_rate: item.tax_rate ?? DEFAULT_TAX_RATE,
      }))
      await updateTemplate(template.id, {
        name,
        description: description || undefined,
        notes: notes || undefined,
        line_items: templateLineItems,
      })
      toast({ title: 'Success', description: 'Template updated' })
      onSave()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Template Name *</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Line Items</Label>
        <LineItemsEditor value={lineItems} onChange={setLineItems} defaultTaxRate={DEFAULT_TAX_RATE} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </div>
  )
}

// Line Item Edit Form
function LineItemEditForm({
  item,
  onSave,
  onCancel,
}: {
  item: SavedLineItemData
  onSave: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description)
  const [category, setCategory] = useState(item.category || '')
  const [quantity, setQuantity] = useState(item.quantity)
  const [unit, setUnit] = useState(item.unit || '')
  const [rate, setRate] = useState(item.rate)
  const [taxRate, setTaxRate] = useState(item.tax_rate)

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Description is required', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { updateSavedLineItem } = await import('@/actions/saved-line-items')
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      if (category) formData.append('category', category)
      formData.append('quantity', quantity.toString())
      formData.append('unit', unit)
      formData.append('rate', rate.toString())
      formData.append('tax_rate', taxRate.toString())
      await updateSavedLineItem(item.id, formData)
      toast({ title: 'Success', description: 'Line item updated!' })
      onSave()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-item-name">Name *</Label>
          <Input id="edit-item-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-item-category">Category</Label>
          <Input
            id="edit-item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Labor, Materials"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-item-description">Description *</Label>
        <Textarea
          id="edit-item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this line item for?"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-item-quantity">Quantity</Label>
          <Input
            id="edit-item-quantity"
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-item-unit">Unit</Label>
          <Input
            id="edit-item-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="hrs, ea, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-item-rate">Rate</Label>
          <Input
            id="edit-item-rate"
            type="number"
            min="0"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-item-tax">Tax %</Label>
          <Input
            id="edit-item-tax"
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  )
}
