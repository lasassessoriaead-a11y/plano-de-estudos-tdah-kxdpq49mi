import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Star, StarOff, History as HistoryIcon, RefreshCw, Scale, PlayCircle } from 'lucide-react'
import {
  favoritarProva,
  getProvaIa,
  listProvasIa,
  listTentativasIa,
  parseQuestoesProva,
  type ProvaIaRecord,
  type TentativaIaRecord,
} from '@/services/central-simulados'
import { cn } from '@/lib/utils'

interface TentativaComProva {
  tentativa: TentativaIaRecord
  prova: ProvaIaRecord | null
}

export default function HistoricoSimulados() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<TentativaComProva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [provas, setProvas] = useState<ProvaIaRecord[]>([])
  const [comparar, setComparar] = useState<TentativaComProva[] | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([listProvasIa(), listTentativasIa()])
      .then(([ps, ts]) => {
        if (!alive) return
        setProvas(ps)
        const mapa = new Map(ps.map((p) => [p.id, p]))
        setItens(
          ts
            .map((t) => ({ tentativa: t, prova: mapa.get(t.prova_id) ?? null }))
            .filter((x): x is TentativaComProva => x.prova !== null),
        )
      })
      .catch(() => alive && toast.error('Erro ao carregar o histórico'))
      .finally(() => alive && setCarregando(false))
    return () => {
      alive = false
    }
  }, [])

  const toggleFavorito = useCallback(async (prova: ProvaIaRecord) => {
    const novo = !prova.favorito
    setProvas((prev) => prev.map((p) => (p.id === prova.id ? { ...p, favorito: novo } : p)))
    try {
      await favoritarProva(prova.id, novo)
    } catch {
      setProvas((prev) => prev.map((p) => (p.id === prova.id ? { ...p, favorito: !novo } : p)))
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

  const provasSalvas = provas.filter(
    (p) => !itens.some((x) => x.prova?.id === p.id && x.tentativa.status === 'em_andamento'),
  )

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
                      onClick={() => x.prova && toggleFavorito(x.prova)}
                      className="shrink-0"
                      aria-label={x.prova?.favorito ? 'Desfavoritar' : 'Favoritar'}
                    >
                      {x.prova?.favorito ? (
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
                      onClick={() => navigate(`/simulados/resultado/${x.tentativa.id}`)}
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

      {/* provas favoritas sem tentativa */}
      {provasSalvas.filter((p) => p.favorito).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Provas favoritas</h2>
          {provasSalvas
            .filter((p) => p.favorito)
            .map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <p className="text-sm font-medium">{p.titulo}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => refazer(p)}>
                      Abrir
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleFavorito(p)}
                      aria-label="Desfavoritar"
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </section>
      )}

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
