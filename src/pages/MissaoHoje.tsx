import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getMissoesData, updateMissao, MissaoRecord } from '@/services/missoes'
import { getQuestoes, updateQuestao, QuestaoRecord } from '@/services/questoes'
import { saveProgresso } from '@/services/progresso'
import { SubjectBadge } from '@/components/SubjectBadge'
import { BreathingCircle } from '@/components/BreathingCircle'
import { RewardConfigDialog } from '@/components/RewardConfigDialog'
import { getRecompensas, RecompensaRecord } from '@/services/recompensas'
import { Button } from '@/components/ui/button'
import {
  Target,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  RotateCcw,
  Sparkles,
  Gift,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function MissaoHoje() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [missoes, setMissoes] = useState<MissaoRecord[]>([])
  const [activeMissao, setActiveMissao] = useState<MissaoRecord | null>(null)

  // Modos do Sprint
  const [sprintMode, setSprintMode] = useState<boolean>(false)
  const [fase, setPhase] = useState<'teoria' | 'pratica' | 'pausa'>('teoria')
  const [timeLeft, setTimeLeft] = useState<number>(600) // 10 min teoria
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  // Prática
  const [questoes, setQuestoes] = useState<QuestaoRecord[]>([])
  const [currentQIdx, setCurrentQIdx] = useState<number>(0)
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null)
  const [answered, setAnswered] = useState<boolean>(false)
  const [recompensasMap, setRecompensasMap] = useState<Record<string, RecompensaRecord>>({})

  const hoje = new Date().toISOString().split('T')[0]

  const loadMissoes = async () => {
    const data = await getMissoesData(hoje)
    setMissoes(data)

    try {
      const recList = await getRecompensas()
      const rMap: Record<string, RecompensaRecord> = {}
      recList.forEach((r) => {
        rMap[r.missao_id] = r
      })
      setRecompensasMap(rMap)
    } catch (err) {
      console.error(err)
    }

    const urlId = searchParams.get('id')
    if (urlId) {
      const found = data.find((m) => m.id === urlId)
      if (found) {
        startSprint(found)
      }
    }
  }

  useEffect(() => {
    loadMissoes()
  }, [])

  // Timer Effect
  useEffect(() => {
    let timer: any
    if (sprintMode && isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && sprintMode && isTimerRunning) {
      handlePhaseComplete()
    }
    return () => clearInterval(timer)
  }, [sprintMode, isTimerRunning, timeLeft])

  const startSprint = async (m: MissaoRecord) => {
    setActiveMissao(m)
    setSprintMode(true)
    setPhase('teoria')
    setTimeLeft(600) // 10 min
    setIsTimerRunning(true)

    // Buscar questões para a prática
    try {
      const qList = await getQuestoes()
      setQuestoes(qList.slice(0, 3))
      setCurrentQIdx(0)
      setSelectedAlt(null)
      setAnswered(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePhaseComplete = async () => {
    setIsTimerRunning(false)
    if (!activeMissao) return

    if (fase === 'teoria') {
      await saveProgresso({
        missao_id: activeMissao.id,
        etapa: 'teoria',
        concluido: true,
        data: hoje,
      })
      toast({ title: 'Teoria concluída! 🚀', description: 'Iniciando Prática de 5 min.' })
      setPhase('pratica')
      setTimeLeft(300) // 5 min
      setIsTimerRunning(true)
    } else if (fase === 'pratica') {
      await saveProgresso({
        missao_id: activeMissao.id,
        etapa: 'pratica',
        concluido: true,
        data: hoje,
      })
      toast({ title: 'Prática concluída! 🧠', description: 'Hora da Pausa Ativa de 3 min.' })
      setPhase('pausa')
      setTimeLeft(180) // 3 min
      setIsTimerRunning(true)
    } else if (fase === 'pausa') {
      await saveProgresso({
        missao_id: activeMissao.id,
        etapa: 'pausa',
        concluido: true,
        data: hoje,
      })
      await updateMissao(activeMissao.id, { status: 'concluida' })

      // Conceder XP
      const currentXp = parseInt(localStorage.getItem('tdah_med_xp') || '250', 10)
      localStorage.setItem('tdah_med_xp', String(currentXp + 50))
      window.dispatchEvent(new Event('storage'))

      toast({
        title: 'Sprint de Estudo Concluído! 🎉',
        description: '+50 XP concedidos. Parabéns pelo foco!',
      })

      setSprintMode(false)
      loadMissoes()
    }
  }

  const handleAnswerQuestion = async (idx: number) => {
    if (answered) return
    setSelectedAlt(idx)
    setAnswered(true)

    const currentQ = questoes[currentQIdx]
    if (!currentQ) return

    const isCorrect = idx === currentQ.gabarito
    try {
      await updateQuestao(currentQ.id, {
        status: isCorrect ? 'acertou' : 'errou',
        revisao_agendada: isCorrect ? undefined : hoje,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const nextQuestion = () => {
    if (currentQIdx < questoes.length - 1) {
      setCurrentQIdx((prev) => prev + 1)
      setSelectedAlt(null)
      setAnswered(false)
    } else {
      handlePhaseComplete()
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const pilde = activeMissao?.expand?.pildes_id
  const topico = pilde?.expand?.topico_id
  const materia = topico?.expand?.materia_id

  return (
    <div className="space-y-6">
      {/* Sprint Overlay (Modo Foco em Tela Cheia) */}
      {sprintMode && activeMissao && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-lg flex flex-col text-white p-4 sm:p-6 overflow-y-auto">
          {/* Header do Sprint */}
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center font-extrabold text-white">
                ⚡
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black">{activeMissao.titulo}</h2>
                {materia && (
                  <SubjectBadge nome={materia.nome} cor={materia.cor} icone={materia.icone} />
                )}
              </div>
            </div>

            <button
              onClick={() => setSprintMode(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper de Fases */}
          <div className="max-w-4xl mx-auto w-full py-4 grid grid-cols-3 gap-2">
            {[
              { id: 'teoria', label: '1. Teoria (10m)' },
              { id: 'pratica', label: '2. Prática (5m)' },
              { id: 'pausa', label: '3. Pausa (3m)' },
            ].map((step) => {
              const isActive = fase === step.id
              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-400 shadow-md scale-102'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {step.label}
                </div>
              )
            })}
          </div>

          {/* Timer Display */}
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider">
                {formatTimer(timeLeft)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl"
              >
                {isTimerRunning ? 'Pausar' : 'Continuar'}
              </Button>
              <Button
                size="sm"
                onClick={handlePhaseComplete}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl"
              >
                Avançar Fase
              </Button>
            </div>
          </div>

          {/* Conteúdo da Fase */}
          <div className="max-w-4xl mx-auto w-full flex-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 overflow-y-auto">
            {/* FASE 1: TEORIA */}
            {fase === 'teoria' && (
              <div className="space-y-4">
                <div className="p-3 bg-violet-950/60 border border-violet-700/50 rounded-xl text-xs text-violet-200 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Leitura Ultravisual de 10 minutos. Foco nos tópicos sem enrolação.</span>
                </div>

                <div
                  className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      pilde?.conteudo_teorico ||
                      '<p>Conteúdo de teoria visual sendo carregado...</p>',
                  }}
                />
              </div>
            )}

            {/* FASE 2: PRÁTICA */}
            {fase === 'pratica' && (
              <div className="space-y-6">
                {questoes.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm italic py-8">
                    Carregando questões da prática imediata...
                  </p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                      <span>
                        Questão {currentQIdx + 1} de {questoes.length}
                      </span>
                      <span>Prática Imediata</span>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-white mb-4">
                      {questoes[currentQIdx]?.enunciado}
                    </p>

                    <div className="space-y-2.5">
                      {(() => {
                        const q = questoes[currentQIdx]
                        if (!q) return null
                        let alts: string[] = []
                        try {
                          alts =
                            typeof q.alternativas === 'string'
                              ? JSON.parse(q.alternativas)
                              : q.alternativas
                        } catch (_) {
                          alts = []
                        }

                        return alts.map((alt, idx) => {
                          const isSelected = selectedAlt === idx
                          const isCorrect = idx === q.gabarito
                          let btnStyle =
                            'bg-slate-700/60 border-slate-600 hover:border-violet-400 text-slate-200'

                          if (answered) {
                            if (isCorrect)
                              btnStyle =
                                'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold'
                            else if (isSelected && !isCorrect)
                              btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 font-bold'
                          }

                          return (
                            <button
                              key={idx}
                              disabled={answered}
                              onClick={() => handleAnswerQuestion(idx)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all duration-200 ${btnStyle}`}
                            >
                              {alt}
                            </button>
                          )
                        })
                      })()}
                    </div>

                    {answered && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                        <div className="flex items-center gap-2">
                          {selectedAlt === questoes[currentQIdx]?.gabarito ? (
                            <span className="text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Resposta Correta! +15 XP
                            </span>
                          ) : (
                            <span className="text-rose-400 font-extrabold text-xs flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Resposta Incorreta (salva no Banco de
                              Erros)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">
                          {questoes[currentQIdx]?.explicacao}
                        </p>
                        <Button
                          size="sm"
                          onClick={nextQuestion}
                          className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl"
                        >
                          Próxima Questão
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FASE 3: PAUSA */}
            {fase === 'pausa' && <BreathingCircle />}
          </div>
        </div>
      )}

      {/* Tela de Listagem de Missões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Missão de Hoje</h1>
            <p className="text-xs text-slate-500 font-medium">
              Sprints focados de 15 minutos (Teoria + Prática + Pausa)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missoes.map((m) => {
            const isDone = m.status === 'concluida'
            const mat = m.expand?.pildes_id?.expand?.topico_id?.expand?.materia_id

            return (
              <div
                key={m.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-elevation transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {mat && <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} />}
                    <span className="text-[11px] font-bold text-slate-400">Sprint 15 min</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{m.titulo}</h3>
                  {recompensasMap[m.id] && (
                    <div className="flex items-center gap-1.5 text-xs text-violet-600 font-bold">
                      <Gift className="w-3.5 h-3.5" />
                      <span className="truncate">{recompensasMap[m.id].titulo}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-xs font-extrabold ${
                        isDone ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {isDone ? '✓ Concluído' : '• Pendente'}
                    </span>
                    <RewardConfigDialog
                      missaoId={m.id}
                      missaoTitulo={m.titulo}
                      existingReward={recompensasMap[m.id]}
                      onSaved={loadMissoes}
                      trigger={recompensasMap[m.id] ? 'edit' : 'add'}
                    />
                  </div>

                  <Button
                    onClick={() => startSprint(m)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isDone ? 'Refazer Sprint' : 'Iniciar Sprint'}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
