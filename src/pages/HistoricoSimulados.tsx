import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Star, StarOff, History as HistoryIcon, RefreshCw, Scale, PlayCircle } from 'lucide-react'
import {
  alternarFavorita,
  listProvasIa,
  listTentativasIa,
  type ProvaIaRecord,
  type TentativaIaRecord,
} from '@/services/central-simulados'

interface TentativaComProva {
  tentativa: TentativaIaRecord
  prova: ProvaIaRecord | null
}

export default function HistoricoSimulados() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<TentativaComProva[]>([])
  const [carregando, setCarregando] = useState(true)

  const [comparar, setComparar] = useState<TentativaComProva[] | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([listProvasIa(), listTentativasIa()])
      .then(([ps, ts]) => {
        if (!alive) return
        const mapa = new Map(ps.map((p) => [p.id, p]))
        setItens(
          ts
            .map((t) => ({ tentativa: t, prova: mapa.get(t.prova_ia_id) ?? null }))
            .filter((x): x is TentativaComProva => x.prova !== null),
        )
      })
      .catch(() => alive && toast.error('Erro ao carregar o histórico'))
      .finally(() => alive && setCarregando(false))
    return () => {
      alive = false
    }
  }, [])

  const toggleFavorito = useCallback(async (x: TentativaComProva) => {
    const novo = !x.tentativa.favorita
    setItens((prev) =>
      prev.map((i) =>
        i.tentativa.id === x.tentativa.id
          ? { ...i, tentativa: { ...i.tentativa, favorita: novo } }
          : i,
      ),
    )
    try {
      await alternarFavorita(x.tentativa)
    } catch {
      setItens((prev) =>
        prev.map((i) =>
          i.tentativa.id === x.tentativa.id
            ? { ...i, tentativa: { ...i.tentativa, favorita: !novo } }
            : i,
        ),
      )
      toast.error('Erro ao favoritar')
    }
  }, [])

  const refazer = useCallback(
    (prova: ProvaIaRecord) => {
      navigate(`/simulados/prova-ia/${prova.id}`)
    },
    [navigate],
  )

  const compararTentativas = useCallback(
    (prova: ProvaIaRecord) => {
      const daProva = itens
        .filter((x) => x.prova?.id === prova.id && x.tentativa.status === 'finalizada')
        .sort((a, b) =>
          (a.tentativa.finalizado_em ?? '').localeCompare(b.tentativa.finalizado_em ?? ''),
        )
      if (daProva.length < 1) {
        toast('Sem tentativas finalizadas desta prova')
        return
      }
      setComparar(daProva)
    },
    [itens],
  )

  const evolucao = useMemo(() => {
    if (!comparar) return null
    return comparar.map((x) => ({
      data: (x.tentativa.finalizado_em ?? '').slice(0, 10),
      pct: x.tentativa.pct_acerto ?? 0,
    }))
  }, [comparar])

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-4">
        <Skeleton className="h-10 w-1/2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <HistoryIcon className="h-6 w-6" /> Histórico de simulados
        </h1>
        <p className="text-sm text-muted-foreground">
          Refaça provas, revise erros, compare tentativas e acompanhe sua evolução.
        </p>
      </div>

      {/* provas em andamento (retomar) */}
      {itens.filter((x) => x.tentativa.status === 'em_andamento').length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Continuar prova salva</h2>
          {itens
            .filter((x) => x.tentativa.status === 'em_andamento')
            .map((x) => (
              <Card key={x.tentativa.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{x.prova?.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Em andamento — retomar de onde parou
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/simulados/prova-ia/${x.prova?.id}`)}>
                    <PlayCircle className="mr-1 h-4 w-4" /> Retomar
                  </Button>
                </CardContent>
              </Card>
            ))}
        </section>
      )}

      {/* histórico de finalizadas */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Tentativas finalizadas</h2>
        {itens.filter((x) => x.tentativa.status === 'finalizada').length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma tentativa ainda.{' '}
            <button className="text-primary underline" onClick={() => navigate('/simulados/criar')}>
              Criar uma prova
            </button>
            .
          </p>
        ) : (
          itens
            .filter((x) => x.tentativa.status === 'finalizada')
            .map((x) => (
              <Card key={x.tentativa.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{x.prova?.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {(x.tentativa.finalizado_em ?? '').slice(0, 10)} ·{' '}
                        {x.tentativa.pct_acerto ?? 0}% de acerto ·{' '}
                        {Math.round((x.tentativa.tempo_usado_seg ?? 0) / 60)} min
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorito(x)}
                      className="shrink-0"
                      aria-label={x.tentativa.favorita ? 'Desfavoritar' : 'Favoritar'}
                    >
                      {x.tentativa.favorita ? (
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => x.prova && refazer(x.prova)}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refazer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/simulados/resultado-ia/${x.tentativa.id}`)}
                    >
                      Revisar erros
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => x.prova && compararTentativas(x.prova)}
                    >
                      <Scale className="mr-1 h-3.5 w-3.5" /> Comparar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </section>

      {/* diálogo de comparação */}
      <Dialog open={comparar !== null} onOpenChange={(open) => !open && setComparar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comparação de tentativas</DialogTitle>
          </DialogHeader>
          {evolucao && (
            <div className="space-y-3">
              {evolucao.map((e, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm">
                    <span>{e.data}</span>
                    <span className="text-muted-foreground">{e.pct}%</span>
                  </div>
                  <Progress value={e.pct} className="mt-1" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {evolucao.length >= 2
                  ? `Evolução de ${evolucao[evolucao.length - 1].pct - evolucao[0].pct}% desde a primeira tentativa.`
                  : 'Faça a prova novamente para comparar tentativas.'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/simulados')}>
          Voltar para a Central
        </Button>
      </div>
    </div>
  )
}
