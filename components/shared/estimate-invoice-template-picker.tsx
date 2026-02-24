'use client'

import { useState, useEffect } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Clock, Receipt, ChevronDown } from 'lucide-react'
import {
  getTemplates,
  type Template,
  type GetTemplatesOptions,
} from '@/actions/estimate-invoice-templates'

export interface TemplateLineItemData {
  description: string
  quantity: number
  unit: string
  rate: number
  tax_rate?: number
}

export interface TemplateData {
  name: string
  notes?: string
  line_items: TemplateLineItemData[]
  due_date_days?: number
  valid_until_days?: number
}

interface EstimateInvoiceTemplatePickerProps {
  onSelect: (template: TemplateData) => void
  templateType: 'estimate' | 'invoice'
}

export function EstimateInvoiceTemplatePicker({
  onSelect,
  templateType,
}: EstimateInvoiceTemplatePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [recentTemplates, setRecentTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRecentTemplates()
  }, [templateType])

  useEffect(() => {
    if (open) {
      loadTemplates(search)
    }
  }, [open, search, templateType])

  const loadRecentTemplates = async () => {
    setLoading(true)
    try {
      const data = await getTemplates({
        type: templateType,
        sortBy: 'last_used_at',
        activeOnly: true,
      })
      setRecentTemplates(data.slice(0, 5))
    } catch (error) {
      console.error('Error loading recent templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async (searchTerm?: string) => {
    setLoading(true)
    try {
      const data = await getTemplates({
        type: templateType,
        search: searchTerm,
        sortBy: 'use_count',
        activeOnly: true,
      })
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (template: Template) => {
    // Convert template to line items format
    const lineItems: TemplateLineItemData[] = (template.line_items || []).map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || '',
      rate: item.rate,
      tax_rate: item.tax_rate,
    }))

    onSelect({
      name: template.name,
      notes: template.notes || undefined,
      line_items: lineItems,
      due_date_days: template.due_date_days || undefined,
      valid_until_days: template.valid_until_days || undefined,
    })

    // Close dialog
    setOpen(false)
    setSearch('')
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start text-left">
          <FileText className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate min-w-0">{search || `Load ${templateType} template`}</span>
          <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-md border bg-background p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4"
            />
          </div>
          <ScrollArea className="h-64 px-1">
            {!search && recentTemplates.length > 0 && (
              <>
                <div className="py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recently Used
                </div>
                {recentTemplates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelect(template)}
                  />
                ))}
                <div className="my-2 border-t" />
              </>
            )}
            <div className="py-2 text-xs font-semibold text-muted-foreground">
              {search ? 'Search Results' : 'All Templates'}
            </div>
            {loading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : templates.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {search ? 'No templates found' : 'No templates yet'}
              </div>
            ) : (
              templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  onSelect={() => handleSelect(template)}
                />
              ))
            )}
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TemplateRow({
  template,
  onSelect,
}: {
  template: Template
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full px-3 py-3 hover:bg-accent text-left transition-colors rounded-md mb-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{template.name}</p>
            <Badge variant="secondary" className="text-xs shrink-0">
              {template.template_type === 'estimate' ? 'Estimate' : 'Invoice'}
            </Badge>
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground truncate mb-1">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              {template.line_items_count} item{template.line_items_count !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Used {template.use_count} time{template.use_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span className="text-sm font-semibold shrink-0">
          ${template.total.toFixed(2)}
        </span>
      </div>
    </button>
  )
}
