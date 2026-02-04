'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  getSavedLineItems,
  getSavedLineItemCategories,
  createSavedLineItem,
  updateSavedLineItem,
  deleteSavedLineItem,
} from '@/actions/saved-line-items'
import { Plus, Edit, Trash2, Star } from 'lucide-react'

export default function SavedLineItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getSavedLineItems({ activeOnly: false }),
        getSavedLineItemCategories(),
      ])
      setItems(itemsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleSave = async (formData: FormData) => {
    try {
      if (editingItem) {
        await updateSavedLineItem(editingItem.id, formData)
      } else {
        await createSavedLineItem(formData)
      }
      setDialogOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteSavedLineItem(id)
      loadData()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="container py-8 w-full overflow-x-hidden">
        <p className="text-center text-muted-foreground w-full overflow-x-hidden">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8 px-4 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-bold w-full overflow-x-hidden">Saved Line Items</h1>
          <p className="text-muted-foreground w-full overflow-x-hidden">Manage reusable line item templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <Plus className="h-4 w-4 mr-2 w-full overflow-x-hidden" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'New Saved Item'}</DialogTitle>
              <DialogDescription>
                Create a reusable line item template for quick access
              </DialogDescription>
            </DialogHeader>
            <SavedLineItemForm
              item={editingItem}
              categories={categories}
              onSubmit={handleSave}
              onCancel={() => {
                setDialogOpen(false)
                setEditingItem(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6 w-full overflow-x-hidden">
        <CardContent className="pt-4 w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row gap-4 w-full overflow-x-hidden">
            <div className="flex-1 w-full overflow-x-hidden">
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background w-full overflow-x-hidden"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center w-full overflow-x-hidden">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground w-full overflow-x-hidden" />
            <h3 className="text-lg font-semibold mb-2 w-full overflow-x-hidden">No saved items found</h3>
            <p className="text-muted-foreground mb-4 w-full overflow-x-hidden">
              {search || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create line item templates to quickly add common items to estimates and invoices'}
            </p>
            {!search && categoryFilter === 'all' && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2 w-full overflow-x-hidden" />
                Create First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full overflow-x-hidden">
          {filteredItems.map((item) => (
            <Card key={item.id} className={item.is_active ? '' : 'opacity-60'}>
              <CardHeader className="pb-3 w-full overflow-x-hidden">
                <div className="flex justify-between items-start w-full overflow-x-hidden">
                  <div className="flex-1 min-w-0 w-full overflow-x-hidden">
                    <CardTitle className="flex items-center gap-2 text-base w-full overflow-x-hidden">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0 w-full overflow-x-hidden" />
                      <span className="truncate w-full overflow-x-hidden">{item.name}</span>
                    </CardTitle>
                    {item.category && (
                      <Badge variant="secondary" className="mt-1 text-xs w-full overflow-x-hidden">{item.category}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 w-full overflow-x-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingItem(item)
                        setDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 w-full overflow-x-hidden" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 w-full overflow-x-hidden" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 w-full overflow-x-hidden">
                <p className="text-sm text-muted-foreground line-clamp-2 w-full overflow-x-hidden">{item.description}</p>
                <div className="flex justify-between items-center w-full overflow-x-hidden">
                  <div className="text-sm w-full overflow-x-hidden">
                    <span className="font-medium w-full overflow-x-hidden">{item.quantity} {item.unit || 'ea'}</span>
                    <span className="text-muted-foreground w-full overflow-x-hidden"> × ${item.rate.toFixed(2)}</span>
                  </div>
                  <div className="text-lg font-bold w-full overflow-x-hidden">
                    ${(item.quantity * item.rate).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full overflow-x-hidden">
                  {item.tax_rate === 0 ? (
                    <Badge variant="outline">Tax Exempt</Badge>
                  ) : (
                    <Badge variant="outline">{item.tax_rate}% Tax</Badge>
                  )}
                  {!item.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                {item.use_count > 0 && (
                  <p className="text-xs text-muted-foreground w-full overflow-x-hidden">
                    Used {item.use_count} {item.use_count === 1 ? 'time' : 'times'}
                    {item.last_used_at && ` • Last ${new Date(item.last_used_at).toLocaleDateString()}`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SavedLineItemForm({
  item,
  categories,
  onSubmit,
  onCancel,
}: {
  item: any
  categories: string[]
  onSubmit: (formData: FormData) => void
  onCancel: () => void
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full overflow-x-hidden">
      <div className="space-y-2 w-full overflow-x-hidden">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={item?.name || ''}
          placeholder="Standard Outlet Installation"
          required
        />
      </div>
      <div className="space-y-2 w-full overflow-x-hidden">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={item?.description || ''}
          placeholder="Detailed description of the work or materials..."
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4 w-full overflow-x-hidden">
        <div className="space-y-2 w-full overflow-x-hidden">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            defaultValue={item?.quantity || 1}
            required
          />
        </div>
        <div className="space-y-2 w-full overflow-x-hidden">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={item?.unit || ''}
            placeholder="hrs, ea, ft"
          />
        </div>
        <div className="space-y-2 w-full overflow-x-hidden">
          <Label htmlFor="rate">Rate *</Label>
          <Input
            id="rate"
            name="rate"
            type="number"
            step="0.01"
            defaultValue={item?.rate || 0}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full overflow-x-hidden">
        <div className="space-y-2 w-full overflow-x-hidden">
          <Label htmlFor="tax_rate">Tax Rate %</Label>
          <Input
            id="tax_rate"
            name="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={item?.tax_rate ?? 13}
          />
        </div>
        <div className="space-y-2 w-full overflow-x-hidden">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={item?.category || ''}
            placeholder="Labor, Materials..."
            list="categories"
          />
          <datalist id="categories">
            {categories.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>
      {item && (
        <div className="flex items-center space-x-2 w-full overflow-x-hidden">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            defaultChecked={item.is_active !== false}
            className="h-4 w-4 w-full overflow-x-hidden"
          />
          <Label htmlFor="is_active" className="cursor-pointer w-full overflow-x-hidden">
            Active (visible in dropdown)
          </Label>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {item ? 'Update' : 'Create'} Item
        </Button>
      </DialogFooter>
    </form>
  )
}
