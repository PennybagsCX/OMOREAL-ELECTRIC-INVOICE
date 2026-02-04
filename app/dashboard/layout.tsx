'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Bell,
  TrendingUp,
  Settings,
  LogOut,
  MoreHorizontal,
  Layers,
} from 'lucide-react'
import { MobileNavSheet } from '@/components/mobile/mobile-nav-sheet'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [showMoreNav, setShowMoreNav] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Estimates', href: '/dashboard/estimates', icon: FileText },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Templates', href: '/dashboard/settings/templates', icon: Layers },
    { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
    { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  // Main items for mobile bottom nav (most frequently used)
  const mobileMainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Estimates', href: '/dashboard/estimates', icon: FileText },
  ]

  // Items that go in the "More" menu
  const moreNavItems = [
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Templates', href: '/dashboard/settings/templates', icon: Layers },
    { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
    { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Top Navigation - Mobile */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="font-bold text-lg">Estimates & Invoices</h1>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 min-h-screen bg-card border-r">
          <div className="p-6">
            <h1 className="font-bold text-xl mb-6">Estimates & Invoices</h1>
            <nav className="space-y-1" aria-label="Main navigation">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-label={item.name}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent w-full text-left transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 pb-20 lg:pb-0 w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-2 z-50 safe-area-inset-bottom" aria-label="Mobile navigation">
        {mobileMainNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 px-4 py-2 text-xs min-w-0 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={active ? 2.5 : 2} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setShowMoreNav(true)}
          aria-label="More navigation options"
          aria-expanded={showMoreNav}
          aria-haspopup="dialog"
          className={`flex flex-col items-center gap-1 px-4 py-2 text-xs min-w-0 transition-colors ${
            pathname && moreNavItems.some(item => isActive(item.href))
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" strokeWidth={pathname && moreNavItems.some(item => isActive(item.href)) ? 2.5 : 2} />
          <span className="font-medium">More</span>
        </button>
      </nav>

      {/* Mobile More Navigation Sheet */}
      <MobileNavSheet open={showMoreNav} onOpenChange={setShowMoreNav} />
    </div>
  )
}
