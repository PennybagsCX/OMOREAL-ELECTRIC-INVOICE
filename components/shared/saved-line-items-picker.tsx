'use client'

import { useState, useEffect } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Star, Search, Clock, ChevronDown } from 'lucide-react'
import { getSavedLineItems, trackSavedLineItemUsage } from '@/actions/saved-line-items'

export interface SavedLineItemData {
  id: string
  name: string
  description: string
  quantity: number
  unit: string | null
  rate: number
  tax_rate: number
  category: string | null
  use_count: number
  last_used_at: string | null
}

export interface LineItemData {
  description: string
  quantity: number
  unit: string
  rate: number
  tax_rate?: number
}

interface SavedLineItemsPickerProps {
  onSelect: (item: LineItemData) => void
  excludeIds?: string[]
}

export function SavedLineItemsPicker({ onSelect, excludeIds = [] }: SavedLineItemsPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<SavedLineItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [recentItems, setRecentItems] = useState<SavedLineItemData[]>([])

  useEffect(() => {
    loadRecentItems()
  }, [])

  useEffect(() => {
    if (open) {
      loadItems(search)
    }
  }, [open, search])

  const loadRecentItems = async () => {
    setLoading(true)
    try {
      const data = await getSavedLineItems({
        sortBy: 'last_used_at',
        activeOnly: true,
      })
      setRecentItems(data?.filter(item => !excludeIds.includes(item.id)).slice(0, 5) || [])
    } catch (error) {
      console.error('Error loading recent items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (searchTerm?: string) => {
    setLoading(true)
    try {
      const data = await getSavedLineItems({
        search: searchTerm,
        activeOnly: true,
        sortBy: 'use_count',
      })
      setItems(data?.filter(item => !excludeIds.includes(item.id)) || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (item: SavedLineItemData) => {
    onSelect({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || '',
      rate: item.rate,
      tax_rate: item.tax_rate,
    })

    // Track usage
    try {
      await trackSavedLineItemUsage(item.id)
    } catch (error) {
      console.error('Error tracking usage:', error)
    }

    setOpen(false)
    setSearch('')
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left overflow-hidden"
        >
          <Star className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{search || 'Search templates'}</span>
          <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-md border bg-background p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4"
            />
          </div>
          <ScrollArea className="h-64 px-1">
            {!search && recentItems.length > 0 && (
              <>
                <div className="py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recently Used
                </div>
                {recentItems.map((item) => (
                  <SavedLineItemRow
                    key={item.id}
                    item={item}
                    onSelect={() => handleSelect(item)}
                  />
                ))}
                <div className="my-2 border-t" />
              </>
            )}
            <div className="py-2 text-xs font-semibold text-muted-foreground">
              {search ? 'Search Results' : 'All Items'}
            </div>
            {loading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {search ? 'No items found' : 'No saved items yet'}
              </div>
            ) : (
              items.map((item) => (
                <SavedLineItemRow
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))
            )}
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SavedLineItemRow({
  item,
  onSelect,
}: {
  item: SavedLineItemData
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full px-3 py-2 hover:bg-accent text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.category && (
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {item.quantity} {item.unit || 'ea'} @ ${item.rate.toFixed(2)}
            </span>
            {item.tax_rate === 0 && (
              <Badge variant="outline" className="text-xs">Tax Exempt</Badge>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold shrink-0">
          ${(item.quantity * item.rate).toFixed(2)}
        </span>
      </div>
    </button>
  )
}
