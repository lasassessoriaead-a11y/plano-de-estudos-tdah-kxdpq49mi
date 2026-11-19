import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ContentProgressRecord, MpcContentRecord } from '@/services/premium'
import { CONTENT_STATUS_LABELS, type ContentStatus } from '@/services/premium'
import { ArrowRight, BookOpen, BrainCircuit, Clock, History, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

export type Recomendacao = {
  titulo: string
  motivo: string
  link: string
  cta: string
  icone: 'target' | 'book' | 'refresh'
}

interface ProximoPassoProps {
  loading?: boolean
  recomendacao: Recomendacao | null
  dificuldades: ContentProgressRecord[]
  conteudos: MpcContentRecord[]
}

export function ProximoPasso(p: ProximoPassoProps) {
  const iconFor = (tipo: string) => {
    if (tipo === 'revisao') return <History className="h-4 w-4 text-amber-500" />
    if (tipo === 'dificuldade') return <BrainCircuit className="h-4 w-4 text-rose-500" />
    if (tipo === 'erro') return <BookOpen className="h-4 w-4 text-orange-500" />
    return <Sparkles className="h-4 w-4 text-primary" />
  }

  const icone = p.recomendacao ? (
    iconFor(p.recomendacao.icone)
  ) : (
    <Clock className="h-4 w-4 text-primary" />
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          {icone}
          <CardTitle className="text-sm">Seu próximo passo</CardTitle>
        </CardHeader>
        <CardContent>
          {p.recomendacao ? (
            <div className="flex flex-col gap-3">
              <div>
                <div className="font-semibold leading-snug">{p.recomendacao.titulo}</div>
                <p className="text-sm text-muted-foreground">{p.recomendacao.motivo}</p>
              </div>
              <Button asChild className="w-fit">
                <Link to={p.recomendacao.link}>
                  {p.recomendacao.cta}
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
          <CardTitle className="text-sm">Retomar conteúdos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ContinueLista
            dificuldades={p.dificuldades}
            conteudos={p.conteudos}
            loading={p.loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ContinueLista(props: {
  dificuldades: ContentProgressRecord[]
  conteudos: MpcContentRecord[]
  loading?: boolean
}) {
  const emAndamento = useMemo(
    () =>
      props.dificuldades
        .map((pr) => ({
          pr,
          c: props.conteudos.find((x) => x.id === pr.conteudo_id),
        }))
        .filter(({ c }) => Boolean(c))
        .slice(0, 4),
    [props.dificuldades, props.conteudos],
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
        const st = (pr?.status || 'nao_iniciado') as ContentStatus
        const questoes = pr?.questoes_realizadas ?? 0
        const acertos = pr?.questoes_acertadas ?? 0
        const taxa = questoes > 0 ? Math.round((acertos / questoes) * 100) : null
        return (
          <Link
            key={c!.id}
            to="/mpc"
            className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-accent/40"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{c!.nome}</div>
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
