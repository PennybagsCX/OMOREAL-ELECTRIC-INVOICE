import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'default' | '4xl' | '6xl' | 'full'
  bottomPadding?: 'default' | 'lg' | 'xl'
}

export function PageContainer({
  children,
  className,
  maxWidth = 'default',
  bottomPadding = 'default'
}: PageContainerProps) {
  const maxWidthClasses = {
    default: '',
    '4xl': 'max-w-4xl mx-auto',
    '6xl': 'max-w-6xl mx-auto',
    full: 'max-w-full'
  }

  const bottomPaddingClasses = {
    default: 'pb-24 lg:pb-8',
    lg: 'pb-32 lg:pb-12',
    xl: 'pb-40 lg:pb-16'
  }

  return (
    <div
      className={cn(
        'container py-8 px-4 w-full overflow-x-hidden',
        maxWidthClasses[maxWidth],
        bottomPaddingClasses[bottomPadding],
        className
      )}
    >
      {children}
    </div>
  )
}
