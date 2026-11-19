import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Flag, Target, TrendingUp, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import RedacaoResultadoCard from '@/components/simulado/RedacaoResultadoCard'
import {
  AREA_LABEL,
  calcularResultado,
  formatarTempo,
  getQuestoesByIds,
  getSimulado,
  getTentativa,
  getTemaRedacao,
  listTentativas,
  parseAlternativas,
  parseAvaliacaoRedacao,
  parseQuestoesIds,
  parseRespostas,
  somaAvaliacaoRedacao,
  type SimQuestaoRecord,
  type TentativaRecord,
} from '@/services/simulados'

export default function SimuladoResultado() {
  const { tentativaId } = useParams<{ tentativaId: string }>()
  const [tentativa, setTentativa] = useState<TentativaRecord | null>(null)
  const [simTitulo, setSimTitulo] = useState('')
  const [questoes, setQuestoes] = useState<SimQuestaoRecord[]>([])
  const [anteriores, setAnteriores] = useState<TentativaRecord[]>([])
  const [simIncluirRedacao, setSimIncluirRedacao] = useState(false)
  const [temaTitulo, setTemaTitulo] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!tentativaId) return
    let mounted = true
    ;(async () => {
      try {
        const tent = await getTentativa(tentativaId)
        if (!mounted) return
        setTentativa(tent)
        const sim = await getSimulado(tent.simulado_id)
        if (!mounted) return
        setSimTitulo(sim.titulo)
        setSimIncluirRedacao(Boolean(sim.incluir_redacao))
        if (sim.incluir_redacao && sim.tema_id) {
          try {
            const tema = await getTemaRedacao(sim.tema_id)
            if (mounted) setTemaTitulo(tema?.titulo)
          } catch {
            /* tema ausente — segue sem título */
          }
        }
        const qs = await getQuestoesByIds(parseQuestoesIds(sim))
        if (!mounted) return
        setQuestoes(qs)
        const todas = await listTentativas({ status: 'finalizada' })
        if (!mounted) return
        setAnteriores(todas.filter((t) => t.id !== tent.id))
      } catch {
        if (mounted) setErro('Não foi possível carregar o resultado.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [tentativaId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-slate-500 font-medium">Carregando resultado…</p>
      </div>
    )
  }

  if (erro || !tentativa) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive font-medium">
          {erro || 'Resultado não encontrado.'}
        </p>
        <Button asChild variant="outline" className="rounded-xl font-bold">
          <Link to="/simulados/enem">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar aos simulados
          </Link>
        </Button>
      </div>
    )
  }

  const respostas = parseRespostas(tentativa)
  const resultado = calcularResultado(questoes, respostas, tentativa.tempo_usado_seg ?? 0)

  // comparacao com a media das tentativas anteriores (mesmo simulado ou qualquer um)
  const pctAnteriores = anteriores.map((t) => t.pct_acerto ?? 0)
  const mediaAnterior = pctAnteriores.length
    ? Math.round(pctAnteriores.reduce((a, b) => a + b, 0) / pctAnteriores.length)
    : null
  const delta = mediaAnterior !== null ? resultado.pctAcerto - mediaAnterior : null

  // redações anteriores (para a evolução)
  const redacoesAnteriores = anteriores
    .filter((t) => t.redacao_texto && t.redacao_texto.trim())
    .slice(0, 10)

  const resumo: { label: string; valor: string | number; cor: string; icon: typeof Target }[] = [
    { label: 'Total de questões', valor: resultado.total, cor: 'text-slate-700', icon: Target },
    { label: 'Acertos', valor: resultado.acertos, cor: 'text-emerald-600', icon: CheckCircle2 },
    { label: 'Erros', valor: resultado.erros, cor: 'text-red-600', icon: XCircle },
    { label: 'Não respondidas', valor: resultado.brancos, cor: 'text-slate-500', icon: Flag },
    {
      label: 'Tempo utilizado',
      valor: formatarTempo(resultado.tempoSeg),
      cor: 'text-slate-700',
      icon: Clock,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resultado</h1>
          <p className="text-sm text-slate-600 font-medium mt-0.5">{simTitulo}</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl font-bold">
          <Link to="/simulados/enem">
            <ArrowLeft className="w-4 h-4 mr-1" /> Simulados
          </Link>
        </Button>
      </div>

      {/* porcentagem geral */}
      <Card className="border-violet-200 bg-violet-50">
        <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="text-center">
            <p className="text-5xl font-black text-violet-700">{resultado.pctAcerto}%</p>
            <p className="text-xs font-bold text-violet-600 mt-1">de acerto</p>
          </div>
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <p className="text-sm font-bold text-violet-900">
              {resultado.acertos} de {resultado.total} questões
            </p>
            {delta !== null && (
              <p
                className={cn(
                  'text-sm font-bold flex items-center gap-1 justify-center sm:justify-start',
                  delta >= 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                <TrendingUp className={cn('w-4 h-4', delta < 0 && 'rotate-180')} />
                {delta >= 0 ? '+' : ''}
                {delta}% vs. média anterior ({mediaAnterior}%)
              </p>
            )}
            {/* estimativa claramente identificada como NÃO oficial */}
            <div className="mt-2 inline-block rounded-lg border border-violet-300 bg-white px-3 py-2">
              <p className="text-sm font-black text-slate-900">
                Estimativa de nota: {resultado.estimativaNaoOficial ?? '—'}
                <span className="text-xs font-bold text-slate-500">/1000</span>
              </p>
              <p className="text-[11px] font-semibold text-amber-700 max-w-md">
                ⚠️ Estimativa NÃO oficial, calculada a partir dos acertos. Não é a nota TRI do INEP
                nem vale como resultado oficial de simulado do ENEM.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {resumo.map((r) => (
          <Card key={r.label}>
            <CardContent className="pt-4 pb-4">
              <r.icon className={cn('w-4 h-4 mb-2', r.cor)} />
              <p className={cn('text-2xl font-black', r.cor)}>{r.valor}</p>
              <p className="text-xs text-slate-500 font-semibold">{r.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* desempenho por área */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Desempenho por área</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resultado.porArea.map((a) => (
            <div key={a.area}>
              <div className="flex items-center justify-between text-sm font-bold mb-1">
                <span className="text-slate-800">{AREA_LABEL[a.area]}</span>
                <span className="text-slate-500">
                  {a.acertos}/{a.total}
                  {a.brancos > 0 ? ` · ${a.brancos} em branco` : ''}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    a.pctAcerto >= 60
                      ? 'bg-emerald-500'
                      : a.pctAcerto >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  style={{ width: `${a.pctAcerto}%` }}
                />
              </div>
            </div>
          ))}
          {resultado.porArea.every((a) => a.total === 0) && (
            <p className="text-sm text-slate-500 font-medium">
              Nenhuma questão registrada para este simulado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* redação */}
      {simIncluirRedacao && (
        <RedacaoResultadoCard
          tentativa={tentativa}
          temaTitulo={temaTitulo}
          onAtualizada={(t) => setTentativa(t)}
        />
      )}

      {/* histórico das redações */}
      {simIncluirRedacao && redacoesAnteriores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">
              Evolução da redação (estimativas não oficiais anteriores)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {redacoesAnteriores.map((t) => {
              const av = parseAvaliacaoRedacao(t)
              const somaRed = av ? somaAvaliacaoRedacao(av) : null
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {t.expand?.simulado_id?.titulo ?? 'Simulado'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {t.created ? new Date(t.created).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {somaRed !== null ? (
                      <p className="text-sm font-black text-emerald-700">
                        {somaRed}
                        <span className="text-xs text-slate-400">/1000</span>
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400">Não avaliada</p>
                    )}
                    {t.redacao_nota_real != null && (
                      <p className="text-[11px] font-bold text-violet-700">
                        real: {t.redacao_nota_real}/1000
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* gabarito comentado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Gabarito comentado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questoes.map((q, i) => {
            const alt = parseAlternativas(q)
            const resp = respostas[q.id]
            const acertou = resp === Number(q.gabarito)
            return (
              <div key={q.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-500">
                    Questão {i + 1} · {AREA_LABEL[q.area]}
                    {q.assunto ? ` · ${q.assunto}` : ''}
                  </p>
                  {resp === undefined ? (
                    <span className="text-xs font-black text-slate-400">Em branco</span>
                  ) : acertou ? (
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acertou
                    </span>
                  ) : (
                    <span className="text-xs font-black text-red-600 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Errou
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                  {q.enunciado}
                </p>
                <div className="space-y-1">
                  {alt.map((texto, ai) => (
                    <p
                      key={ai}
                      className={cn(
                        'text-sm px-3 py-1.5 rounded-lg',
                        ai === Number(q.gabarito)
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : resp === ai
                            ? 'bg-red-50 text-red-700 font-semibold'
                            : 'text-slate-600',
                      )}
                    >
                      {String.fromCharCode(65 + ai)}) {texto}
                    </p>
                  ))}
                </div>
                {q.resolucao && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-700 mb-1">Resolução comentada</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{q.resolucao}</p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
