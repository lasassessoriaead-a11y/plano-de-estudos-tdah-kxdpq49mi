import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  prioridade?: number
  className?: string
}

export function PriorityBadge({ prioridade = 1, className }: PriorityBadgeProps) {
  let label = 'Prioridade Baixa'
  let styleClasses = 'bg-muted text-muted-foreground border-border'

  if (prioridade === 1) {
    label = 'Prioridade Alta (ENEM)'
    styleClasses = 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
  } else if (prioridade === 2) {
    label = 'Prioridade Média'
    styleClasses = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
        styleClasses,
        className,
      )}
    >
      {label}
    </span>
  )
}
