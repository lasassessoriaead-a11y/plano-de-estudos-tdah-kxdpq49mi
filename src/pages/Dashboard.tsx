import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ProximoPasso } from '@/components/dashboard/ProximoPasso'
import { EmptyState } from '@/components/EmptyState'
import {
  summarizeXp,
  getXpTransactions,
  getMissoesConcluidas,
  getQuestoesUsuario,
  getContentProgress,
  getMpcContents,
  getStudySessions,
  type ContentProgressRecord,
  type MpcContentRecord,
  type StudySessionRecord,
} from '@/services/premium'
import type { MissaoRecord } from '@/services/missoes'
import {
  BookOpenCheck,
  ClipboardList,
  History,
  Sparkles,
  Timer,
  ArrowRight,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react'

const fmtDataLonga = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function getSaudacao() {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function SaudacaoIcon() {
  const h = new Date().getHours()
  if (h < 12) return <Sun className="h-5 w-5 text-amber-500" />
  if (h < 18) return <Sunset className="h-5 w-5 text-orange-400" />
  return <Moon className="h-5 w-5 text-indigo-400" />
}

const diasAtras = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const semanaSegunda = (offset: number) => {
  const d = new Date()
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow - offset * 7)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [xp, setXp] = useState({
    xpTotal: 0,
    nivel: 1,
    xpNoNivel: 0,
    xpProximoNivel: 500,
    progressoNivel: 0,
  })
  const [streak, setStreak] = useState(0)
  const [questoes, setQuestoes] = useState<{ resolvidas: number; acertos: number }>({
    resolvidas: 0,
    acertos: 0,
  })
  const [missoesConcluidas, setMissoesConcluidas] = useState(0)
  const [minutosHoje, setMinutosHoje] = useState(0)
  const [horasSemanais, setHorasSemanais] = useState<{ semana: string; horas: number }[]>([])
  const [comparativo, setComparativo] = useState<
    { semana: string; atual: number; anterior: number }[]
  >([])
  const [evolucao, setEvolucao] = useState<{ dia: string; acerto: number; questoes: number }[]>([])
  const [desempenhoMateria, setDesempenhoMateria] = useState<
    { materia: string; acerto: number; questoes: number }[]
  >([])
  const [ultimasAtividades, setUltimasAtividades] = useState<
    { id: string; titulo: string; data: string; minutos: number }[]
  >([])
  const [recomendacao, setRecomendacao] = useState<{
    titulo: string
    motivo: string
    link: string
    cta: string
    icone: 'target' | 'book' | 'refresh'
  } | null>(null)
  const [conteudosMpc, setConteudosMpc] = useState({ dominados: 0, total: 0 })
  const [metaDiaria, setMetaDiaria] = useState(0)
  const [dificuldadesMpc, setDificuldadesMpc] = useState<ContentProgressRecord[]>([])
  const [conteudosMap, setConteudosMap] = useState<MpcContentRecord[]>([])

  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    ;(async () => {
      try {
        const [txs, missoes, questoesList, prefsRows, sessionsList, progressoList, conteudosList] =
          await Promise.all([
            getXpTransactions(user.id),
            getMissoesConcluidas(user.id),
            getQuestoesUsuario(user.id),
            pbGetPrefs(user.id),
            getStudySessions(user.id),
            getContentProgress(user.id),
            getMpcContents(),
          ])
        if (!mounted) return

        setXp(summarizeXp(txs))
        setMissoesConcluidas(missoes.length)

        // streak: dias consecutivos com missão concluída
        const diasSet = new Set(missoes.map((m) => (m.data || '').slice(0, 10)))
        let s = 0
        const cursor = new Date()
        for (let i = 0; i < 400; i++) {
          const key = cursor.toISOString().slice(0, 10)
          if (diasSet.has(key)) s++
          else if (i === 0) {
            // hoje pode ainda não estar concluído: olha ontem antes de parar
          } else break
          cursor.setDate(cursor.getDate() - 1)
        }
        setStreak(s)

        const resolvidas = questoesList.filter(
          (q) => q.status === 'acertou' || q.status === 'errou',
        )
        const acertos = resolvidas.filter((q) => q.status === 'acertou').length
        setQuestoes({ resolvidas: resolvidas.length, acertos })

        // minutos de estudo hoje (sessões registradas)
        const hoje = new Date().toISOString().slice(0, 10)
        setMinutosHoje(
          sessionsList
            .filter((x) => (x.data || '').slice(0, 10) === hoje)
            .reduce((sum, x) => sum + (x.minutos || 0), 0),
        )

        // horas por semana (últimas 4 semanas) a partir de sessões
        const semanas = [3, 2, 1, 0].map((off) => {
          const ini = semanaSegunda(off)
          const fim = semanaSegunda(off - 1)
          const minutos = sessionsList
            .filter((x) => (x.data || '').slice(0, 10) >= ini && (x.data || '').slice(0, 10) < fim)
            .reduce((sum, x) => sum + (x.minutos || 0), 0)
          return { semana: `S${4 - off}`, horas: Math.round((minutos / 60) * 10) / 10 }
        })
        setHorasSemanais(semanas)
        setComparativo([
          { semana: 'Anterior', anterior: semanas[2].horas, atual: 0 },
          { semana: 'Atual', anterior: 0, atual: semanas[3].horas },
        ])

        // evolução de acertos por dia (últimos 10 dias com dados)
        const porDia = new Map<string, { total: number; acertos: number }>()
        for (const q of resolvidas) {
          const dia = (q.created || '').slice(0, 10)
          if (!dia) continue
          const rec = porDia.get(dia) || { total: 0, acertos: 0 }
          rec.total++
          if (q.status === 'acertou') rec.acertos++
          porDia.set(dia, rec)
        }
        const evo = [...porDia.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-10)
          .map(([dia, v]) => ({
            dia: dia.slice(5),
            acerto: Math.round((v.acertos / v.total) * 100),
            questoes: v.total,
          }))
        setEvolucao(evo)

        // desempenho por matéria (via questões -> pildes -> topico -> materia)
        const nomeMateria = new Map<string, string>()
        for (const c of conteudosList) {
          const exp = c.expand as unknown as { materia_id?: { nome?: string } } | undefined
          const nome = exp?.materia_id?.nome
          if (nome) nomeMateria.set(String(c.materia_id || ''), nome)
        }
        const porMateria = new Map<string, { total: number; acertos: number }>()
        for (const q of resolvidas) {
          const mid = q.materia_id || 'sem'
          const rec = porMateria.get(mid) || { total: 0, acertos: 0 }
          rec.total++
          if (q.status === 'acertou') rec.acertos++
          porMateria.set(mid, rec)
        }
        const dm = [...porMateria.entries()].map(([mid, v]) => ({
          materia: nomeMateria.get(mid) || (mid === 'sem' ? 'Sem matéria' : mid.slice(0, 6)),
          acerto: Math.round((v.acertos / v.total) * 100),
          questoes: v.total,
        }))
        setDesempenhoMateria(dm.slice(0, 8))

        // MPC dominados
        setConteudosMpc({
          dominados: progressoList.filter((p) => p.status === 'dominado').length,
          total: conteudosList.length,
        })
        setDificuldadesMpc(progressoList.filter((p) => p.dificuldades && p.status !== 'dominado'))
        setConteudosMap(conteudosList)

        // últimas atividades: missões concluídas recentes
        setUltimasAtividades(
          missoes.slice(0, 5).map((m) => ({
            id: m.id,
            titulo: m.titulo || 'Missão de sprint',
            data: (m.data || '').slice(0, 10),
            minutos: 0,
          })),
        )

        // meta diária
        if (prefsRows) setMetaDiaria(prefsRows.meta_diaria_min || 0)

        // recomendação "Seu próximo passo"
        setRecomendacao(calcularRecomendacao(progressoList, conteudosList, missoes))
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro ao carregar dados', description: String(err), variant: 'destructive' })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user?.id])

  const taxaAcerto =
    questoes.resolvidas > 0 ? Math.round((questoes.acertos / questoes.resolvidas) * 100) : null

  const proximasMissoes = useMemo<MissaoRecord[]>(() => [], [])

  const nomePrimeiro = (user?.name || '').split(' ')[0] || 'estudante'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <SaudacaoIcon />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {getSaudacao()}, {nomePrimeiro}
            </h1>
          </div>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {fmtDataLonga.format(new Date())}
          </p>
        </div>
        <Button asChild>
          <Link to="/missao">
            <Sparkles className="mr-2 h-4 w-4" /> Missão de hoje
          </Link>
        </Button>
      </div>

      <KpiGrid
        loading={loading}
        xpTotal={xp.xpTotal}
        nivel={xp.nivel}
        xpNoNivel={xp.xpNoNivel}
        xpProximoNivel={xp.xpProximoNivel}
        streakDias={streak}
        questoesResolvidas={questoes.resolvidas}
        taxaAcerto={taxaAcerto}
        minutosHoje={minutosHoje}
        metaDiaria={metaDiaria}
        questoesAtrasadas={0}
        missoesConcluidas={missoesConcluidas}
        conteudosDominados={conteudosMpc.dominados}
      />

      <ProximoPasso
        recomendacao={recomendacao}
        loading={loading}
        dificuldades={dificuldadesMpc}
        conteudos={conteudosMap}
      />

      <DashboardCharts
        loading={loading}
        evolucaoAcertos={evolucao}
        horasPorSemana={horasSemanais}
        desempenhoMateria={desempenhoMateria}
        comparativoSemanas={comparativo}
      />

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <History className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Continue estudando</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ultimasAtividades.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="Nenhuma atividade ainda"
              description="Conclua sua primeira missão de sprint para começar seu histórico."
              action={
                <Button asChild>
                  <Link to="/missao">Ir para missões</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {ultimasAtividades.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/missao"
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')} • {a.minutos}{' '}
                        min
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Timer className="h-3 w-3" /> {a.minutos} min
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Progresso geral (MPC)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : conteudosMpc.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum conteúdo cadastrado no MPC ainda.{' '}
              <Link to="/mpc" className="font-medium text-primary hover:underline">
                Cadastrar conteúdos
              </Link>
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{conteudosMpc.dominados}</span>
                <span className="text-muted-foreground">
                  de {conteudosMpc.total} conteúdos dominados
                </span>
              </div>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                Domínio registrado manualmente por você no MPC — nada inventado.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// helper para preferências sem import circular extra
async function pbGetPrefs(userId: string) {
  const { getUserPreferences } = await import('@/services/premium')
  return getUserPreferences(userId)
}

function calcularRecomendacao(
  progressoList: ContentProgressRecord[],
  conteudosList: MpcContentRecord[],
  missoes: readonly { id: string; status?: string; data?: string }[],
): {
  titulo: string
  motivo: string
  link: string
  cta: string
  icone: 'target' | 'book' | 'refresh'
} | null {
  // 1) revisões atrasadas
  const atrasada = progressoList.find(
    (p) =>
      p.proxima_revisao &&
      p.proxima_revisao <= new Date().toISOString().slice(0, 10) &&
      p.status !== 'dominado',
  )
  if (atrasada) {
    const c = conteudosList.find((x) => x.id === atrasada.conteudo_id)
    return {
      titulo: c?.nome || 'Revisão pendente',
      motivo: 'Revisão agendada para hoje (revisão espaçada).',
      link: '/erros',
      cta: 'Revisar agora',
      icone: 'refresh',
    }
  }
  // 2) conteúdo com dificuldade registrada
  const dificil = progressoList.find((p) => p.dificuldades && p.status !== 'dominado')
  if (dificil) {
    const c = conteudosList.find((x) => x.id === dificil.conteudo_id)
    return {
      titulo: c?.nome || 'Conteúdo difícil',
      motivo: 'Você registrou dificuldade neste conteúdo.',
      link: '/mpc',
      cta: 'Retomar estudo',
      icone: 'target',
    }
  }
  // 3) conteúdo em andamento
  const emAndamento = progressoList.find((p) => p.status === 'em_andamento')
  if (emAndamento) {
    const c = conteudosList.find((x) => x.id === emAndamento.conteudo_id)
    return {
      titulo: c?.nome || 'Conteúdo em andamento',
      motivo: 'Continue de onde parou.',
      link: '/mpc',
      cta: 'Continuar',
      icone: 'book',
    }
  }
  // 4) missão de hoje
  const hoje = new Date().toISOString().slice(0, 10)
  const missaoHoje = missoes.find((m) => (m.data || '').slice(0, 10) === hoje)
  if (missaoHoje) {
    return {
      titulo: 'Missão de hoje',
      motivo: 'Há uma missão de sprint programada para hoje.',
      link: '/missao',
      cta: 'Abrir missão',
      icone: 'book',
    }
  }
  return null
}
