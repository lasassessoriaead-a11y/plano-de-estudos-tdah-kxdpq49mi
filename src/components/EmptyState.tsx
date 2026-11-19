import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export function EmptyStateLink(props: EmptyStateProps & { href: string; hrefLabel: string }) {
  const { href, hrefLabel, ...rest } = props
  return (
    <EmptyState
      {...rest}
      action={
        <Button asChild variant="outline" size="sm">
          <Link to={href}>{hrefLabel}</Link>
        </Button>
      }
    />
  )
}

export function EmptyIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="h-8 w-8" />
}
