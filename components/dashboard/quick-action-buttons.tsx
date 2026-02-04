import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  href: string
  icon?: LucideIcon
}

interface QuickActionButtonsProps {
  actions: QuickAction[]
  className?: string
}

export function QuickActionButtons({ actions, className }: QuickActionButtonsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => (
        <Button key={action.href} asChild variant="default">
          <Link href={action.href}>
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
