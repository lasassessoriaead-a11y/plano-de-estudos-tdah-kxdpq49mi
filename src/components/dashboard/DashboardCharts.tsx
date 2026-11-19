import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { TrendingUp, CalendarRange, BarChart3 } from 'lucide-react'

interface DashboardChartsProps {
  loading?: boolean
  evolucaoAcertos: { dia: string; acerto: number; questoes: number }[]
  horasPorSemana: { semana: string; horas: number }[]
  desempenhoMateria: { materia: string; acerto: number; questoes: number }[]
  comparativoSemanas: { semana: string; atual: number; anterior: number }[]
}

const CHART_AXIS = { fontSize: 11, fill: 'currentColor', opacity: 0.65 }

function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {msg}
    </div>
  )
}

export function DashboardCharts(p: DashboardChartsProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark')),
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  if (p.loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
  const tooltipStyle = {
    backgroundColor: isDark ? '#18181b' : '#ffffff',
    border: `1px solid ${isDark ? '#3f3f46' : '#e2e8f0'}`,
    borderRadius: 10,
    fontSize: 12,
    color: isDark ? '#fafafa' : '#0f172a',
  }

  const hasEvolucao = p.evolucaoAcertos.length > 0
  const hasHoras = p.horasPorSemana.some((h) => h.horas > 0)
  const hasDesempenho = p.desempenhoMateria.length > 0
  const hasComparativo = p.comparativoSemanas.some((s) => s.atual > 0 || s.anterior > 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Evolução de acertos</CardTitle>
        </CardHeader>
        <CardContent>
          {hasEvolucao ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={p.evolucaoAcertos}
                margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tick={CHART_AXIS} stroke="currentColor" opacity={0.5} />
                <YAxis
                  tick={CHART_AXIS}
                  stroke="currentColor"
                  opacity={0.5}
                  unit="%"
                  domain={[0, 100]}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Acerto']} />
                <Line
                  type="monotone"
                  dataKey="acerto"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="Responda questões em uma missão para ver sua evolução" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Horas estudadas por semana</CardTitle>
        </CardHeader>
        <CardContent>
          {hasHoras ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={p.horasPorSemana}
                margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" tick={CHART_AXIS} stroke="currentColor" opacity={0.5} />
                <YAxis tick={CHART_AXIS} stroke="currentColor" opacity={0.5} unit="h" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}h`, 'Estudo']} />
                <Bar
                  dataKey="horas"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="Conclua missões para registrar horas de estudo" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Desempenho por matéria</CardTitle>
        </CardHeader>
        <CardContent>
          {hasDesempenho ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={p.desempenhoMateria}
                margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="materia" tick={CHART_AXIS} stroke="currentColor" opacity={0.5} />
                <YAxis
                  tick={CHART_AXIS}
                  stroke="currentColor"
                  opacity={0.5}
                  unit="%"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, n) => [
                    n === 'acerto' ? `${v}%` : v,
                    n === 'acerto' ? 'Acerto' : 'Questões',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="acerto"
                  name="Acerto (%)"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="questoes"
                  name="Questões"
                  fill="hsl(var(--chart-2))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="Sem questões respondidas por matéria ainda" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Comparativo entre semanas</CardTitle>
        </CardHeader>
        <CardContent>
          {hasComparativo ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={p.comparativoSemanas}
                margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" tick={CHART_AXIS} stroke="currentColor" opacity={0.5} />
                <YAxis tick={CHART_AXIS} stroke="currentColor" opacity={0.5} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="anterior"
                  name="Semana anterior"
                  fill="hsl(var(--chart-3))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="atual"
                  name="Semana atual"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="Complete missões em duas semanas para comparar" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
