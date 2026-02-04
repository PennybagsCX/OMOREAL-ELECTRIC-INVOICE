'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Bell,
  TrendingUp,
  Settings,
  Layers,
} from 'lucide-react'

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Estimates', href: '/dashboard/estimates', icon: FileText },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Templates', href: '/dashboard/settings/templates', icon: Layers },
  { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
  { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileNavSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigate = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[75vh] pb-safe-area-inset-bottom">
        <SheetHeader className="text-left pb-4">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1 px-2 overflow-y-auto max-h-[calc(75vh-8rem)]" role="navigation" aria-label="Full navigation menu">
          {allNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.href)}
                aria-label={`Navigate to ${item.name}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">{item.name}</span>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
