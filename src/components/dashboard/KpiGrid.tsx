import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Flame,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  Percent,
  BookOpenCheck,
  AlarmClock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiGridProps {
  loading?: boolean
  xpTotal: number
  nivel: number
  xpNoNivel: number
  xpProximoNivel: number
  streakDias: number
  questoesResolvidas: number
  taxaAcerto: number | null
  minutosHoje: number
  metaDiaria: number
  questoesAtrasadas: number
}

interface Kpi {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent: string
  progress?: number // 0..100 opcional
}

export function KpiGrid(p: KpiGridProps) {
  if (p.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const kpis: Kpi[] = [
    {
      label: 'XP total',
      value: String(p.xpTotal),
      sub: `Nível ${p.nivel} • ${p.xpNoNivel}/${p.xpProximoNivel} XP`,
      icon: <Zap className="h-4 w-4" />,
      accent: 'text-amber-500 dark:text-amber-400',
      progress: (p.xpNoNivel / p.xpProximoNivel) * 100,
    },
    {
      label: 'Dias consecutivos',
      value: String(p.streakDias),
      sub: p.streakDias > 0 ? 'Mantenha o ritmo!' : 'Estude hoje para começar',
      icon: <Flame className="h-4 w-4" />,
      accent: 'text-orange-500 dark:text-orange-400',
    },
    {
      label: 'Questões resolvidas',
      value: String(p.questoesResolvidas),
      sub:
        p.taxaAcerto !== null
          ? `${p.taxaAcerto}% de acerto`
          : 'Responda questões para medir o acerto',
      icon: <Target className="h-4 w-4" />,
      accent: 'text-sky-500 dark:text-sky-400',
      progress: p.taxaAcerto !== null ? p.taxaAcerto : undefined,
    },
    {
      label: 'Taxa de acerto',
      value: p.taxaAcerto !== null ? `${p.taxaAcerto}%` : '—',
      sub: p.taxaAcerto !== null ? 'Baseada nas questões respondidas' : 'Sem dados ainda',
      icon: <Percent className="h-4 w-4" />,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Tempo hoje',
      value: `${p.minutosHoje} min`,
      sub: p.metaDiaria > 0 ? `Meta: ${p.metaDiaria} min` : 'Defina uma meta em Configurações',
      icon: <Clock className="h-4 w-4" />,
      accent: 'text-violet-500 dark:text-violet-400',
      progress: p.metaDiaria > 0 ? Math.min(100, (p.minutosHoje / p.metaDiaria) * 100) : undefined,
    },
    {
      label: 'Missões concluídas',
      value: String(p.missoesConcluidas ?? 0),
      sub: 'Sprints finalizadas',
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Conteúdos dominados',
      value: String(p.conteudosDominados ?? 0),
      sub: 'No MPC',
      icon: <BookOpenCheck className="h-4 w-4" />,
      accent: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Revisões atrasadas',
      value: String(p.questoesAtrasadas),
      sub: p.questoesAtrasadas > 0 ? 'Acesse o Banco de Erros' : 'Em dia!',
      icon: <AlarmClock className="h-4 w-4" />,
      accent:
        p.questoesAtrasadas > 0
          ? 'text-red-500 dark:text-red-400'
          : 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card
          key={k.label}
          className="border-border/60 bg-card/60 shadow-sm transition-colors hover:bg-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {k.label}
            </CardTitle>
            <span className={cn(k.accent)}>{k.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{k.value}</div>
            {k.sub && <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>}
            {k.progress !== undefined && <Progress value={k.progress} className="mt-2 h-1.5" />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
