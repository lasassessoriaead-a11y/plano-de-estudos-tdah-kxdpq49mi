import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { pb } from '@/lib/pocketbase/client'
import type { ContentProgressRecord, MpcContentRecord } from '@/services/premium'
import type { ProgressoRecord } from '@/services/progresso'
import type { QuestaoRecord } from '@/services/questoes'
import { ArrowRight, BookOpen, BrainCircuit, Clock, History, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CONTENT_STATUS_LABELS, type ContentStatus } from '@/services/premium'
import { Skeleton } from '@/components/ui/skeleton'

interface ProximoPassoProps {
  loading?: boolean
  progressoMap: Record<string, ContentProgressRecord>
  mpcContents: MpcContentRecord[]
  missoesHoje: { id: string; status: string; pilde_id: string }[]
  questoes: QuestaoRecord[]
}

function isAtrasado(c: ContentProgressRecord): boolean {
  if (c.proxima_revisao) {
    const hoje = new Date().toISOString().slice(0, 10)
    if (c.proxima_revisao <= hoje && c.status !== 'dominado') return true
  }
  return false
}

function statusContent(c?: ContentProgressRecord): ContentStatus {
  return (c?.status as ContentStatus) || 'nao_iniciado'
}

export function ProximoPasso(p: ProximoPassoProps) {
  const recomendacao = useMemo(() => {
    // 1. revisões atrasadas têm prioridade máxima
    const atrasados = p.mpcContents.filter((c) => {
      const pr = p.progressoMap[c.id]
      return pr && isAtrasado(pr)
    })
    if (atrasados.length > 0) {
      return {
        titulo: atrasados[0].nome,
        motivo: 'Revisão atrasada — o conteúdo está no seu ciclo de revisão',
        cta: 'Revisar agora',
        to: '/mpc',
        tipo: 'revisao' as const,
      }
    }

    // 2. missões de hoje pendentes
    const missaoPendente = p.missoesHoje.find((m) => m.status !== 'concluida')
    if (missaoPendente) {
      return {
        titulo: 'Missão de sprint de hoje',
        motivo: 'Sua missão diária está aguardando — teoria, prática e pausa',
        cta: 'Abrir missão',
        to: '/missao',
        tipo: 'missao' as const,
      }
    }

    // 3. conteúdo com dificuldades registradas e não dominado
    const comDificuldade = p.mpcContents
      .map((c) => p.progressoMap[c.id])
      .filter((pr) => pr && pr.dificuldades && pr.status !== 'dominado')
    if (comDificuldade.length > 0) {
      const c = p.mpcContents.find((x) => x.id === comDificuldade[0]!.conteudo_id)
      if (c) {
        return {
          titulo: c.nome,
          motivo: 'Você registrou dificuldade aqui — vale reforçar',
          cta: 'Retomar conteúdo',
          to: '/mpc',
          tipo: 'dificuldade' as const,
        }
      }
    }

    // 4. questões erradas para refazer
    const erradas = p.questoes.filter((q) => q.status === 'errou')
    if (erradas.length > 0) {
      return {
        titulo: 'Refazer questões erradas',
        motivo: 'Você tem questões erradas no banco de erros',
        cta: 'Abrir banco de erros',
        to: '/banco-erros',
        tipo: 'erro' as const,
      }
    }

    // 5. próximo conteúdo não iniciado
    const naoIniciado = p.mpcContents.find(
      (c) => statusContent(p.progressoMap[c.id]) === 'nao_iniciado',
    )
    if (naoIniciado) {
      return {
        titulo: naoIniciado.nome,
        motivo: 'Próximo conteúdo da sua trilha',
        cta: 'Começar agora',
        to: '/mpc',
        tipo: 'novo' as const,
      }
    }

    return null
  }, [p.progressoMap, p.mpcContents, p.missoesHoje, p.questoes])

  const ultimas = useMemo(() => {
    const out: { id: string; nome: string; quando: string; to: string; tipo: string }[] = []

    // últimas missões concluídas
    const concluidas = pb
      .collection('missoes')
      .filter((m) => m.status === 'concluida')
      .slice(0, 3)

    return out
  }, [])

  const iconFor = (tipo: string) => {
    if (tipo === 'revisao') return <History className="h-4 w-4 text-amber-500" />
    if (tipo === 'missao') return <Sparkles className="h-4 w-4 text-primary" />
    if (tipo === 'dificuldade') return <BrainCircuit className="h-4 w-4 text-rose-500" />
    if (tipo === 'erro') return <BookOpen className="h-4 w-4 text-orange-500" />
    return <Clock className="h-4 w-4 text-sky-500" />
  }

  if (p.loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Seu próximo passo</CardTitle>
        </CardHeader>
        <CardContent>
          {recomendacao ? (
            <div className="flex flex-col gap-3">
              <div>
                <div className="font-semibold leading-snug">{recomendacao.titulo}</div>
                <p className="text-sm text-muted-foreground">{recomendacao.motivo}</p>
              </div>
              <Button asChild className="w-fit">
                <Link to={recomendacao.to}>
                  {recomendacao.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tudo em dia! Comece um novo conteúdo no MPC.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Continue estudando</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ContinueLista
            progressoMap={p.progressoMap}
            mpcContents={p.mpcContents}
            loading={p.loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ContinueLista(props: {
  progressoMap: Record<string, ContentProgressRecord>
  mpcContents: MpcContentRecord[]
  loading?: boolean
}) {
  const emAndamento = useMemo(
    () =>
      props.mpcContents
        .map((c) => ({ c, pr: props.progressoMap[c.id] }))
        .filter(({ pr }) => {
          const st = statusContent(pr)
          return st === 'em_andamento' || st === 'em_revisao' || st === 'planejado'
        })
        .slice(0, 4),
    [props.progressoMap, props.mpcContents],
  )

  if (props.loading) {
    return (
      <>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </>
    )
  }

  if (emAndamento.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma atividade em andamento. Explore o MPC para escolher o próximo conteúdo.
      </p>
    )
  }

  return (
    <>
      {emAndamento.map(({ c, pr }) => {
        const st = statusContent(pr)
        const questoes = pr?.questoes_realizadas ?? 0
        const acertos = pr?.questoes_acertadas ?? 0
        const taxa = questoes > 0 ? Math.round((acertos / questoes) * 100) : null
        return (
          <Link
            key={c.id}
            to="/mpc"
            className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-accent/40"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{c.nome}</div>
              <div className="text-xs text-muted-foreground">
                {CONTENT_STATUS_LABELS[st] ?? 'Não iniciado'}
                {taxa !== null ? ` • ${taxa}% de acerto` : ''}
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {pr?.nivel_dominio ?? 0}%
            </Badge>
          </Link>
        )
      })}
      <Progress value={0} className="hidden" />
    </>
  )
}
