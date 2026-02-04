'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'

interface FilterConfig {
  search: string
  status?: string
  client?: string
}

interface DataTableProps {
  data: any[]
  columns: {
    key: string
    label: string
    render?: (item: any) => React.ReactNode
  }[]
  filters?: {
    status?: boolean
    client?: boolean
  }
  onFilteredChange?: (filtered: any[]) => void
  getRowLink?: (item: any) => string
}

export function DataTable({ data, columns, filters, onFilteredChange, getRowLink }: DataTableProps) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    search: '',
    status: 'all',
    client: 'all',
  })

  const filteredData = data.filter((item) => {
    // Search filter
    if (filterConfig.search) {
      const searchLower = filterConfig.search.toLowerCase()
      const searchableText = [
        item.estimate_number || item.invoice_number || '',
        item.client?.name || '',
        item.notes || '',
      ].join(' ').toLowerCase()

      if (!searchableText.includes(searchLower)) {
        return false
      }
    }

    // Status filter
    if (filterConfig.status && filterConfig.status !== 'all' && item.status !== filterConfig.status) {
      return false
    }

    return true
  })

  // Notify parent of filtered data
  if (onFilteredChange) {
    onFilteredChange(filteredData)
  }

  const clearFilters = () => {
    setFilterConfig({ search: '', status: 'all', client: 'all' })
  }

  const hasActiveFilters = filterConfig.search || filterConfig.status !== 'all' || filterConfig.client !== 'all'

  return (
    <div className="space-y-4 w-full overflow-x-hidden">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={filterConfig.search}
            onChange={(e) => setFilterConfig({ ...filterConfig, search: e.target.value })}
            className="pl-8"
          />
        </div>

        {filters?.status && (
          <Select
            value={filterConfig.status}
            onValueChange={(value) => setFilterConfig({ ...filterConfig, status: value })}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="partial">PARTIAL</SelectItem>
              <SelectItem value="paid">PAID</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredData.length} of {data.length} items
      </p>

      {/* Table - Desktop */}
      <div className="hidden md:block rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    No results found
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const rowLink = getRowLink?.(item)
                  const rowContent = (
                    <>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap">
                          {col.render ? col.render(item) : item[col.key]}
                        </td>
                      ))}
                    </>
                  )

                  return (
                    <tr
                      key={item.id || index}
                      className={rowLink ? "border-b hover:bg-muted/50 cursor-pointer" : "border-b hover:bg-muted/50"}
                    >
                      {rowLink ? (
                        <td colSpan={columns.length} className="p-0">
                          <Link href={rowLink} className="block px-4 py-3">
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4">
                              {columns.map((col) => (
                                <div key={col.key} className="text-sm whitespace-nowrap">
                                  {col.render ? col.render(item) : item[col.key]}
                                </div>
                              ))}
                            </div>
                          </Link>
                        </td>
                      ) : (
                        rowContent
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No results found
          </div>
        ) : (
          filteredData.map((item, index) => {
            const cardLink = getRowLink?.(item)
            const cardContent = (
              <>
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">{col.label}</span>
                    <span className="text-sm font-medium text-right truncate">
                      {col.render ? col.render(item) : item[col.key]}
                    </span>
                  </div>
                ))}
              </>
            )

            return (
              <div key={item.id || index} className={cardLink ? "rounded-md border overflow-hidden" : "rounded-md border p-4 space-y-2 overflow-hidden"}>
                {cardLink ? (
                  <Link href={cardLink} className="block p-4 space-y-2 hover:bg-muted/50 transition-colors">
                    {cardContent}
                  </Link>
                ) : (
                  <div className="p-4 space-y-2">
                    {cardContent}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
