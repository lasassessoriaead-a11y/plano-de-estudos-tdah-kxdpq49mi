import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Flag,
  PenLine,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import RedacaoEditor from '@/components/simulado/RedacaoEditor'
import {
  AREA_LABEL,
  parseAlternativas,
  parseMarcadas,
  parseQuestoesIds,
  parseRespostas,
  parseConfig,
  calcularResultado,
  getQuestoesByIds,
  getSimulado,
  getTentativa,
  salvarTentativa,
  criarTentativa,
  getTentativaEmAndamento,
  getTemaRedacao,
  type SimQuestaoRecord,
  type SimuladoRecord,
  type TemaRedacaoRecord,
  type TentativaRecord,
} from '@/services/simulados'

const formatarRelogio = (seg: number) => {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export default function Prova() {
  const { simuladoId } = useParams<{ simuladoId: string }>()
  const navigate = useNavigate()

  const [simulado, setSimulado] = useState<SimuladoRecord | null>(null)
  const [questoes, setQuestoes] = useState<SimQuestaoRecord[]>([])
  const [tema, setTema] = useState<TemaRedacaoRecord | null>(null)
  const [tentativa, setTentativa] = useState<TentativaRecord | null>(null)
  const [etapa, setEtapa] = useState<'objetivas' | 'redacao'>('objetivas')
  const [atual, setAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [tempoSeg, setTempoSeg] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmarFim, setConfirmarFim] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  const respostasRef = useRef(respostas)
  respostasRef.current = respostas
  const marcadasRef = useRef(marcadas)
  marcadasRef.current = marcadas
  const tempoRef = useRef(0)
  const textoRedacaoRef = useRef<string | null>(null)

  // ------- carregar simulado + tentativa (existente ou nova) -------
  useEffect(() => {
    if (!simuladoId) return
    let mounted = true
    ;(async () => {
      try {
        const sim = await getSimulado(simuladoId)
        if (!mounted) return
        setSimulado(sim)
        const qs = await getQuestoesByIds(parseQuestoesIds(sim))
        if (!mounted) return
        setQuestoes(qs)

        let tent = await getTentativaEmAndamento(simuladoId)
        if (!tent) tent = await criarTentativa(simuladoId)
        if (!mounted) return
        setTentativa(tent)
        setRespostas(parseRespostas(tent))
        setMarcadas(parseMarcadas(tent))
        setTempoSeg(tent.tempo_usado_seg ?? 0)
        // redação: etapa inicial depende de já ter texto salvo (retomada)
        const temTextoRedacao = Boolean(tent.redacao_texto && tent.redacao_texto.trim().length)
        if (sim.incluir_redacao && temTextoRedacao) {
          setEtapa('redacao')
        }

        if (sim.incluir_redacao && sim.tema_id) {
          try {
            const t = await getTemaRedacao(sim.tema_id)
            if (mounted) setTema(t)
          } catch {
            /* tema ausente: sem etapa de redação */
          }
        }
        if (!mounted) return
        setCarregando(false)
      } catch {
        if (mounted) {
          setErro('Não foi possível carregar o simulado.')
          setCarregando(false)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [simuladoId])

  // ------- autosave (a cada mudança de resposta/marcada + a cada 20s) -------
  const persistir = useCallback(async () => {
    if (!tentativa) return
    try {
      await salvarTentativa(tentativa.id, {
        respostas: respostasRef.current,
        marcadas: marcadasRef.current,
        tempoUsadoSeg: tempoRef.current,
      })
    } catch {
      /* silencioso: próxima mudança tenta de novo */
    }
  }, [tentativa])

  useEffect(() => {
    if (tentativa) persistir()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respostas, marcadas])

  useEffect(() => {
    if (!tentativa) return
    const iv = window.setInterval(persistir, 20000)
    return () => window.clearInterval(iv)
  }, [tentativa, persistir])

  // ------- cronômetro -------
  useEffect(() => {
    const iv = window.setInterval(() => {
      tempoRef.current += 1
      setTempoSeg(tempoRef.current)
    }, 1000)
    return () => window.clearInterval(iv)
  }, [])

  const duracaoSeg = (simulado?.duracao_min ?? 60) * 60
  const restanteSeg = Math.max(0, duracaoSeg - tempoSeg)
  const tempoEsgotado = restanteSeg <= 0

  const finalizar = useCallback(async () => {
    if (!tentativa || !questoes.length) return
    setFinalizando(true)
    const resultado = calcularResultado(questoes, respostasRef.current, tempoRef.current)
    try {
      await salvarTentativa(tentativa.id, {
        respostas: respostasRef.current,
        marcadas: [],
        tempoUsadoSeg: tempoRef.current,
        status: 'finalizada',
        finalizadoEm: new Date().toISOString(),
        pctAcerto: resultado.pctAcerto,
        // garante que o texto digitado no fim não se perca (autosave tem debounce)
        ...(temRedacao && textoRedacaoRef.current !== null
          ? { redacaoTexto: textoRedacaoRef.current }
          : {}),
      })
      navigate(`/simulados/enem/resultado/${tentativa.id}`)
    } catch {
      setFinalizando(false)
      setConfirmarFim(false)
    }
  }, [tentativa, questoes, navigate])

  // tempo esgotado finaliza automaticamente
  useEffect(() => {
    if (tempoEsgotado && !finalizando && tentativa) finalizar()
  }, [tempoEsgotado, finalizando, tentativa, finalizar])

  const temRedacao = Boolean(simulado?.incluir_redacao && tema && tentativa)
  const atualQuestao = questoes[atual]
  const alternativasAtual = useMemo(
    () => (atualQuestao ? parseAlternativas(atualQuestao) : []),
    [atualQuestao],
  )

  const marcar = (qId: string, alt: number) => {
    setRespostas((prev) => {
      // clicar na mesma alternativa desmarca
      if (prev[qId] === alt) {
        const { [qId]: _rem, ...rest } = prev
        return rest
      }
      return { ...prev, [qId]: alt }
    })
  }

  const alternarMarcada = (qId: string) => {
    setMarcadas((prev) => (prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]))
  }

  const respondidasCount = Object.keys(respostas).length
  const totalEtapas = questoes.length + (temRedacao ? 1 : 0)
  const progressoAtual = etapa === 'redacao' ? totalEtapas : atual + 1

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-slate-500 font-medium">Carregando simulado…</p>
      </div>
    )
  }

  if (erro || !simulado || !tentativa || !atualQuestao) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive font-medium">{erro || 'Simulado não encontrado.'}</p>
        <Button asChild variant="outline" className="rounded-xl font-bold">
          <Link to="/simulados/enem">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar aos simulados
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* barra superior: progresso + cronômetro */}
      <Card className="sticky top-[60px] z-10">
        <CardContent className="pt-3 pb-3 flex items-center gap-3 flex-wrap">
          <Link
            to="/simulados/enem"
            className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Sair
          </Link>
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs font-bold text-slate-500">
              {etapa === 'redacao' ? (
                <>Redação (etapa final) · {respondidasCount} objetivas respondidas</>
              ) : (
                <>
                  Questão {atual + 1} de {questoes.length} · {respondidasCount} respondidas
                </>
              )}
            </p>
            <div className="h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{ width: `${(progressoAtual / Math.max(totalEtapas, 1)) * 100}%` }}
              />
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm',
              restanteSeg < 300 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700',
            )}
          >
            <Timer className="w-4 h-4" /> {formatarRelogio(restanteSeg)}
          </div>
        </CardContent>
      </Card>

      {etapa === 'objetivas' ? (
        <>
          {/* enunciado + alternativas */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">
                  {AREA_LABEL[atualQuestao.area]}
                  {atualQuestao.assunto ? ` · ${atualQuestao.assunto}` : ''}
                </p>
                <p className="text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                  {atualQuestao.enunciado}
                </p>
              </div>
              <div className="space-y-2">
                {alternativasAtual.map((alt, i) => {
                  const selecionada = respostas[atualQuestao.id] === i
                  return (
                    <button
                      key={i}
                      onClick={() => marcar(atualQuestao.id, i)}
                      className={cn(
                        'w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all',
                        selecionada
                          ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-black',
                          selecionada ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm text-slate-800 font-medium leading-relaxed">
                        {alt}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold"
                  onClick={() => alternarMarcada(atualQuestao.id)}
                >
                  {marcadas.includes(atualQuestao.id) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-1 text-amber-600" /> Marcada
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" /> Marcar p/ revisão
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-400 font-medium">Resposta salva automaticamente</p>
              </div>
            </CardContent>
          </Card>

          {/* navegação */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              disabled={atual === 0}
              onClick={() => setAtual((v) => Math.max(0, v - 1))}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            {atual < questoes.length - 1 ? (
              <Button
                className="rounded-xl font-bold bg-violet-600 hover:bg-violet-700"
                onClick={() => setAtual((v) => v + 1)}
              >
                Próxima <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : temRedacao ? (
              <Button
                className="rounded-xl font-bold bg-violet-600 hover:bg-violet-700"
                onClick={() => setEtapa('redacao')}
              >
                <PenLine className="w-4 h-4 mr-1" /> Ir para a Redação
              </Button>
            ) : (
              <Button
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setConfirmarFim(true)}
              >
                <Flag className="w-4 h-4 mr-1" /> Finalizar
              </Button>
            )}
          </div>

          {/* mapa de questões */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-bold text-slate-500 mb-2">Navegação de questões</p>
              <div className="flex flex-wrap gap-1.5">
                {questoes.map((q, i) => {
                  const respondida = respostas[q.id] !== undefined
                  const marcada = marcadas.includes(q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => setAtual(i)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-black border transition-colors',
                        i === atual && 'ring-2 ring-violet-500',
                        marcada
                          ? 'bg-amber-100 border-amber-400 text-amber-800'
                          : respondida
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
                      )}
                      title={
                        marcada
                          ? `Questão ${i + 1} — marcada para revisão`
                          : respondida
                            ? `Questão ${i + 1} — respondida`
                            : `Questão ${i + 1} — não respondida`
                      }
                    >
                      {i + 1}
                    </button>
                  )
                })}
                {temRedacao && (
                  <button
                    onClick={() => setEtapa('redacao')}
                    className={cn(
                      'px-2 h-8 rounded-lg text-xs font-black border transition-colors',
                      'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100',
                    )}
                    title="Ir para a etapa da redação"
                  >
                    <PenLine className="w-3.5 h-3.5 inline" /> Redação
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-violet-600 inline-block" /> Respondidas (
                  {respondidasCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block" />{' '}
                  Não respondidas ({questoes.length - respondidasCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400 inline-block" />{' '}
                  Marcadas ({marcadas.length})
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* ---------- ETAPA REDAÇÃO ---------- */
        <>
          {tema && (
            <RedacaoEditor
              key={tentativa.id}
              tentativaId={tentativa.id}
              tema={tema}
              textoInicial={tentativa.redacao_texto ?? ''}
              onTextoChange={(t) => (textoRedacaoRef.current = t)}
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => setEtapa('objetivas')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar às questões
            </Button>
            <Button
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setConfirmarFim(true)}
            >
              <Flag className="w-4 h-4 mr-1" /> Finalizar prova
            </Button>
          </div>
        </>
      )}

      {/* confirmar finalização */}
      <AlertDialog open={confirmarFim} onOpenChange={setConfirmarFim}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar simulado?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu {respondidasCount} de {questoes.length} questões
              {questoes.length - respondidasCount > 0
                ? ` — ${questoes.length - respondidasCount} ficarão em branco`
                : ''}
              {temRedacao
                ? '. A redação será avaliada por estimativa automática depois de finalizar.'
                : ''}
              . Depois de finalizar, não é possível voltar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar prova</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={finalizando}
              onClick={(e) => {
                e.preventDefault()
                finalizar()
              }}
            >
              {finalizando ? (
                'Finalizando…'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Finalizar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
