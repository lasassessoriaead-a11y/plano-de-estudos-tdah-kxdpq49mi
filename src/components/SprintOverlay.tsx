import { useState, useEffect, useCallback, useRef } from 'react'
import { X, BookOpen, PenTool, Coffee, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubjectBadge } from '@/components/SubjectBadge'
import { BreathingCircle } from '@/components/BreathingCircle'
import { MissaoRecord, updateMissao } from '@/services/missoes'
import { upsertProgresso, getProgressoByMissao } from '@/services/progresso'
import { getQuestoes } from '@/services/questoes'
import { cn } from '@/lib/utils'

type Fase = 'teoria' | 'pratica' | 'pausa'
const FASES: Fase[] = ['teoria', 'pratica', 'pausa']
const FASE_INFO: Record<Fase, { label: string; icon: typeof BookOpen }> = {
  teoria: { label: 'Teoria', icon: BookOpen },
  pratica: { label: 'Prática', icon: PenTool },
  pausa: { label: 'Pausa', icon: Coffee },
}

interface SprintOverlayProps {
  missao: MissaoRecord
  onClose: () => void
  onComplete: () => void
}

export function SprintOverlay({ missao, onClose, onComplete }: SprintOverlayProps) {
  const [faseAtual, setFaseAtual] = useState<Fase>('teoria')
  const [fasesConcluidas, setFasesConcluidas] = useState<Set<Fase>>(new Set())
  const [loading, setLoading] = useState(false)
  const [questoes, setQuestoes] = useState<any[]>([])
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null)
  const [respostaConfirmada, setRespostaConfirmada] = useState(false)
  const loadingRef = useRef(false)

  const pilde = missao.expand?.pildes_id
  const mat = (pilde as any)?.expand?.topico_id?.expand?.materia_id

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [progresso, questoesData] = await Promise.all([
          getProgressoByMissao(missao.id),
          getQuestoes(),
        ])
        const concluidas = new Set<Fase>()
        progresso.forEach((p) => {
          if (p.etapa && p.concluido) concluidas.add(p.etapa as Fase)
        })
        setFasesConcluidas(concluidas)
        const primeiraFase = FASES.find((f) => !concluidas.has(f)) || 'pausa'
        setFaseAtual(primeiraFase)
        const pildeQuestoes = (questoesData as any[]).filter(
          (q) => q.pildes_id === missao.pildes_id,
        )
        setQuestoes(pildeQuestoes)
      } catch (err) {
        console.error('Erro ao carregar progresso:', err)
      }
    }
    loadInitial()
  }, [missao.id, missao.pildes_id])

  useEffect(() => {
    if (missao.status === 'pendente') {
      updateMissao(missao.id, { status: 'em_andamento' }).catch(() => {})
    }
  }, [missao.id, missao.status])

  const handleAvancar = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      await upsertProgresso(missao.id, faseAtual)
      const novasConcluidas = new Set(fasesConcluidas)
      novasConcluidas.add(faseAtual)
      setFasesConcluidas(novasConcluidas)
      const idxAtual = FASES.indexOf(faseAtual)
      if (idxAtual < FASES.length - 1) {
        setFaseAtual(FASES[idxAtual + 1])
        setRespostaSelecionada(null)
        setRespostaConfirmada(false)
      } else {
        await updateMissao(missao.id, { status: 'concluida' })
        onComplete()
      }
    } catch (err) {
      console.error('Erro ao avançar:', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [faseAtual, fasesConcluidas, missao.id, onComplete])

  const idxAtual = FASES.indexOf(faseAtual)
  const isUltimaFase = idxAtual === FASES.length - 1
  const podeAvancar = faseAtual !== 'pratica' || questoes.length === 0 || respostaConfirmada

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {mat && <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} />}
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{missao.titulo}</h2>
              <p className="text-sm font-semibold text-slate-800">
                {pilde?.titulo || 'Sprint de Estudo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
          {FASES.map((fase, idx) => {
            const Info = FASE_INFO[fase]
            const Icon = Info.icon
            const isConcluida = fasesConcluidas.has(fase)
            const isAtual = fase === faseAtual
            return (
              <div key={fase} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all',
                    isConcluida && 'bg-emerald-100 text-emerald-700',
                    isAtual &&
                      !isConcluida &&
                      'bg-violet-100 text-violet-700 ring-2 ring-violet-300',
                    !isConcluida && !isAtual && 'bg-slate-100 text-slate-600',
                  )}
                >
                  {isConcluida ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span>{Info.label}</span>
                </div>
                {idx < FASES.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 rounded-full',
                      isConcluida ? 'bg-emerald-400' : 'bg-slate-300',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {faseAtual === 'teoria' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-extrabold text-slate-900">Teoria</h3>
              </div>
              <div
                className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-li:text-slate-800 prose-strong:text-slate-900"
                dangerouslySetInnerHTML={{
                  __html:
                    pilde?.conteudo_teorico ||
                    '<p class="text-slate-800">Conteúdo teórico não disponível para esta missão.</p>',
                }}
              />
            </div>
          )}
          {faseAtual === 'pratica' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">Prática</h3>
              </div>
              {questoes.length > 0 ? (
                questoes.map((q, qi) => {
                  const alts: string[] = Array.isArray(q.alternativas) ? q.alternativas : []
                  return (
                    <div key={q.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <p className="text-sm font-bold text-slate-900 mb-3">
                        {qi + 1}. {q.enunciado}
                      </p>
                      <div className="space-y-2">
                        {alts.map((alt, ai) => (
                          <button
                            key={ai}
                            onClick={() => !respostaConfirmada && setRespostaSelecionada(ai)}
                            className={cn(
                              'w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
                              respostaSelecionada === ai
                                ? 'border-violet-500 bg-violet-50 text-slate-900'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-violet-300',
                              respostaConfirmada &&
                                ai === q.gabarito &&
                                'border-emerald-500 bg-emerald-50 text-emerald-800',
                              respostaConfirmada &&
                                ai === respostaSelecionada &&
                                ai !== q.gabarito &&
                                'border-red-500 bg-red-50 text-red-800',
                            )}
                          >
                            <span className="font-extrabold mr-2 text-slate-900">
                              {String.fromCharCode(65 + ai)})
                            </span>
                            {alt}
                          </button>
                        ))}
                      </div>
                      {respostaConfirmada && q.explicacao && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-sm font-bold text-blue-900 mb-1">Explicação:</p>
                          <p className="text-sm text-blue-800">{q.explicacao}</p>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
                  <PenTool className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-900">
                    Nenhuma questão disponível para esta missão.
                  </p>
                  <p className="text-sm text-slate-700 mt-1">
                    Você pode avançar para a próxima fase.
                  </p>
                </div>
              )}
              {faseAtual === 'pratica' && questoes.length > 0 && !respostaConfirmada && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setRespostaConfirmada(true)}
                    disabled={respostaSelecionada === null}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                  >
                    Confirmar resposta
                  </Button>
                </div>
              )}
            </div>
          )}
          {faseAtual === 'pausa' && (
            <div className="space-y-4 flex flex-col items-center text-center py-6">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">Pausa</h3>
              </div>
              <p className="text-sm font-semibold text-slate-800 max-w-md">
                Respire fundo e descanse por alguns minutos. Você está quase lá!
              </p>
              <BreathingCircle />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-900">
              Fase {idxAtual + 1} de {FASES.length}:{' '}
              <span className="text-slate-900">{FASE_INFO[faseAtual].label}</span>
            </div>
            <Button
              onClick={handleAvancar}
              disabled={loading || !podeAvancar}
              className={cn(
                'font-bold rounded-xl flex items-center gap-2 px-6 text-white transition-all',
                isUltimaFase
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-violet-600 hover:bg-violet-700',
                (loading || !podeAvancar) && 'opacity-60 cursor-not-allowed',
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  {isUltimaFase ? 'Concluir Missão' : 'Avançar'}{' '}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
