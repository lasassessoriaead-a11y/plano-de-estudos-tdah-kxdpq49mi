import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Trophy, XCircle } from 'lucide-react'
import {
  analisarResultadoIa,
  getTentativaIa,
  parseQuestoesProva,
  type AnaliseIa,
  type QuestaoProva,
} from '@/services/central-simulados'
import ResultadoDetalhes from '@/components/simulados/ResultadoDetalhes'

interface ResultadoJson {
  total: number
  acertos: number
  erros: number
  brancos: number
  pctAcerto: number
  porMateria: { materia: string; total: number; acertos: number }[]
}

export default function ResultadoIaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [tentativa, setTentativa] = useState<Awaited<ReturnType<typeof getTentativaIa>> | null>(
    null,
  )
  const [prova, setProva] = useState<Awaited<
    ReturnType<typeof import('@/services/central-simulados').getProvaIa>
  > | null>(null)
  const [analise, setAnalise] = useState<AnaliseIa | null>(null)
  const [analisando, setAnalisando] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([
      getTentativaIa(id),
      import('@/services/central-simulados').then((m) => m.getProvaIa),
    ])
      .then(([t, getProva]) => Promise.all([t, getProva(t.prova_ia_id)]))
      .then(([t, p]) => {
        if (!alive) return
        setTentativa(t)
        setProva(p)
      })
      .catch(() => alive && toast.error('Não foi possível carregar o resultado'))
      .finally(() => alive && setCarregando(false))
    return () => {
      alive = false
    }
  }, [id])

  const questoes: QuestaoProva[] = useMemo(() => (prova ? parseQuestoesProva(prova) : []), [prova])

  const resultado = useMemo<ResultadoJson | null>(() => {
    if (!tentativa?.resultado_json) return null
    const raw =
      typeof tentativa.resultado_json === 'string'
        ? tentativa.resultado_json
        : JSON.stringify(tentativa.resultado_json)
    try {
      const v = JSON.parse(raw) as ResultadoJson
      return {
        ...v,
        porMateria: Array.isArray(v.porMateria) ? v.porMateria : [],
      }
    } catch {
      return null
    }
  }, [tentativa])

  const analisar = useCallback(async () => {
    if (!tentativa || !prova) return
    setAnalisando(true)
    try {
      const res = await analisarResultadoIa(tentativa.id)
      setAnalise(res)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na análise com IA')
    } finally {
      setAnalisando(false)
    }
  }, [tentativa, prova])

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!tentativa || !prova || !resultado) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p>Resultado não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/simulados/historico')}>
          Voltar ao histórico
        </Button>
      </div>
    )
  }

  const mapaRespostas: Record<string, string> = (() => {
    const r = tentativa.respostas_json
    if (typeof r === 'string') {
      try {
        return JSON.parse(r || '{}') as Record<string, string>
      } catch {
        return {}
      }
    }
    return r ?? {}
  })()

  const questoesErradas = questoes.filter(
    (q) =>
      q.gabarito !== undefined &&
      mapaRespostas[q.id] !== undefined &&
      Number(mapaRespostas[q.id]) !== Number(q.gabarito),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <p className="text-sm text-muted-foreground">Resultado</p>
        <h1 className="text-2xl font-bold">{prova.titulo}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{resultado.acertos}</p>
            <p className="text-xs text-muted-foreground">Acertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{resultado.erros}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{resultado.pctAcerto}%</p>
            <p className="text-xs text-muted-foreground">Aproveitamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {Math.round((tentativa.tempo_usado_seg ?? 0) / 60)} min
            </p>
            <p className="text-xs text-muted-foreground">Tempo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" /> Desempenho por matéria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resultado.porMateria.map((d) => (
            <div key={d.materia}>
              <div className="flex justify-between text-sm">
                <span>{d.materia}</span>
                <span className="text-muted-foreground">
                  {d.acertos}/{d.total}
                </span>
              </div>
              <Progress value={d.total ? (d.acertos / d.total) * 100 : 0} className="mt-1" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Questões erradas (com resolução)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questoesErradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma errada — parabéns! 🎉</p>
          ) : (
            questoesErradas.map((q) => (
              <ResultadoDetalhes key={q.id} questao={q} numero={questoes.indexOf(q) + 1} idx={0} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> Análise com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analise ? (
            <>
              {analise.erros_principais?.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Erros principais</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                    {analise.erros_principais.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(analise.padroes?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium">Padrões de erro</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                    {analise.padroes.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(analise.recomendacoes?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium">Recomendações</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                    {analise.recomendacoes.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analise.nova_prova_direcionada && (
                <Button
                  onClick={() =>
                    navigate('/simulados/criar', {
                      state: {
                        modo: 'inedito_ia',
                        materias: analise.nova_prova_direcionada?.materias ?? [],
                        qtd: analise.nova_prova_direcionada?.qtd_sugerida ?? 10,
                        dificuldade: analise.nova_prova_direcionada?.dificuldade ?? 'medio',
                        titulo: 'Prova direcionada pela IA',
                        motivo: 'Baseada nos seus erros na última prova.',
                      },
                    })
                  }
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Criar prova direcionada
                </Button>
              )}
            </>
          ) : (
            <Button onClick={analisar} disabled={analisando}>
              <Sparkles className="mr-2 h-4 w-4" />
              {analisando ? 'Analisando…' : 'Analisar meu resultado com IA'}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('/simulados/historico')}>
          Ir para o histórico
        </Button>
        <Button variant="outline" onClick={() => navigate(`/simulados/prova-ia/${prova.id}`)}>
          <XCircle className="mr-2 h-4 w-4" /> Refazer prova
        </Button>
      </div>
    </div>
  )
}
