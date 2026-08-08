import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  prioridade?: number
  className?: string
}

export function PriorityBadge({ prioridade = 1, className }: PriorityBadgeProps) {
  let label = 'Prioridade Baixa'
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200'

  if (prioridade === 1) {
    label = 'Prioridade Alta (ENEM)'
    styleClasses = 'bg-rose-50 text-rose-700 border-rose-200'
  } else if (prioridade === 2) {
    label = 'Prioridade Média'
    styleClasses = 'bg-amber-50 text-amber-700 border-amber-200'
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
