import { cn } from '@/lib/utils'
import {
  Dna,
  FlaskConical,
  Calculator,
  PenTool,
  Zap,
  BookOpen,
  Landmark,
  Globe,
  Users,
  Brain,
  LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Dna,
  FlaskConical,
  Calculator,
  PenTool,
  Zap,
  BookOpen,
  Landmark,
  Globe,
  Users,
  Brain,
}

interface SubjectBadgeProps {
  nome: string
  cor?: string
  icone?: string
  peso?: number
  className?: string
}

export function SubjectBadge({ nome, cor = '#7C3AED', icone, peso, className }: SubjectBadgeProps) {
  const IconComp = icone ? iconMap[icone] || BookOpen : BookOpen

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs transition-transform hover:scale-105',
        className,
      )}
      style={{
        backgroundColor: `${cor}15`,
        color: cor,
        border: `1px solid ${cor}40`,
      }}
    >
      <IconComp className="w-3.5 h-3.5" style={{ color: cor }} />
      <span>{nome}</span>
      {peso !== undefined && (
        <span
          className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: cor }}
        >
          P{peso}
        </span>
      )}
    </span>
  )
}
