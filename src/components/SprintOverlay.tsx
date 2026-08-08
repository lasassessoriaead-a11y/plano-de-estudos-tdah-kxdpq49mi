import { useState, useEffect, useRef } from 'react'
import { getQuestoes, updateQuestao, QuestaoRecord } from '@/services/questoes'
import { saveProgresso } from '@/services/progresso'
import { updateMissao, MissaoRecord } from '@/services/missoes'
import { SubjectBadge } from '@/components/SubjectBadge'
import { BreathingCircle } from '@/components/BreathingCircle'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Clock, X, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

interface SprintOverlayProps {
  missao: MissaoRecord
  onClose: () => void
  onComplete: () => void
}

type Fase = 'teoria' | 'pratica' | 'pausa'

const PHASE_CONFIG: Record<Fase, { duration: number; label: string; next?: Fase }> = {
  teoria: { duration: 600, label: '1. Teoria (10m)', next: 'pratica' },
  pratica: { duration: 300, label: '2. Prática (5m)', next: 'pausa' },
  pausa: { duration: 180, label: '3. Pausa (3m)' },
}

export function SprintOverlay({ missao, onClose, onComplete }: SprintOverlayProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [fase, setFase] = useState<Fase>('teoria')
  const [timeLeft, setTimeLeft] = useState(600)
  const [isRunning, setIsRunning] = useState(true)
  const [questoes, setQuestoes] = useState<QuestaoRecord[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const completingRef = useRef(false)
  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => {
    getQuestoes()
      .then((q) => setQuestoes(q.slice(0, 3)))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    return () => clearInterval(t)
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) handlePhaseComplete()
  }, [timeLeft, isRunning])

  const handlePhaseComplete = async () => {
    if (completingRef.current) return
    completingRef.current = true
    setIsRunning(false)

    try {
      await saveProgresso({
        missao_id: missao.id,
        etapa: fase,
        concluido: true,
        data: hoje,
        usuario_id: user?.id,
      })
    } catch (err) {
      console.error('Failed to save progress:', err)
    }

    const config = PHASE_CONFIG[fase]
    if (config.next) {
      const next = config.next
      setFase(next)
      setTimeLeft(PHASE_CONFIG[next].duration)
      setSelectedAlt(null)
      setAnswered(false)
      completingRef.current = false
      setIsRunning(true)
      toast({
        title: next === 'pratica' ? 'Teoria concluída! 🚀' : 'Prática concluída! 🧠',
        description:
          next === 'pratica' ? 'Iniciando Prática de 5 min.' : 'Hora da Pausa Ativa de 3 min.',
      })
    } else {
      try {
        await updateMissao(missao.id, { status: 'concluida' })
      } catch (err) {
        console.error(err)
      }
      const xp = parseInt(localStorage.getItem('tdah_med_xp') || '250', 10)
      localStorage.setItem('tdah_med_xp', String(xp + 50))
      window.dispatchEvent(new Event('storage'))
      toast({
        title: 'Sprint Concluído! 🎉',
        description: '+50 XP concedidos. Parabéns pelo foco!',
      })
      onComplete()
    }
  }

  const handleAnswer = async (idx: number) => {
    if (answered) return
    setSelectedAlt(idx)
    setAnswered(true)
    const q = questoes[qIdx]
    if (!q) return
    try {
      await updateQuestao(q.id, {
        status: idx === q.gabarito ? 'acertou' : 'errou',
        revisao_agendada: idx === q.gabarito ? undefined : hoje,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const nextQuestion = () => {
    if (qIdx < questoes.length - 1) {
      setQIdx((p) => p + 1)
      setSelectedAlt(null)
      setAnswered(false)
    } else handlePhaseComplete()
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const pilde = missao.expand?.pildes_id
  const materia = pilde?.expand?.topico_id?.expand?.materia_id

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-lg flex flex-col text-white p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center font-extrabold">
            ⚡
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">{missao.titulo}</h2>
            {materia && (
              <SubjectBadge nome={materia.nome} cor={materia.cor} icone={materia.icone} />
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full py-4 grid grid-cols-3 gap-2">
        {(Object.keys(PHASE_CONFIG) as Fase[]).map((f) => (
          <div
            key={f}
            className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
              fase === f
                ? 'bg-violet-600 text-white border-violet-400 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {PHASE_CONFIG[f].label}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto w-full flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider">
            {fmt(timeLeft)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl"
          >
            {isRunning ? 'Pausar' : 'Continuar'}
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

      <div className="max-w-4xl mx-auto w-full flex-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 overflow-y-auto">
        {fase === 'teoria' && (
          <div className="space-y-4">
            <div className="p-3 bg-violet-950/60 border border-violet-700/50 rounded-xl text-sm text-violet-200 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Leitura de 10 minutos. Foco nos tópicos sem enrolação.</span>
            </div>
            <div
              className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: pilde?.conteudo_teorico || '<p>Conteúdo teórico em carregamento...</p>',
              }}
            />
          </div>
        )}
        {fase === 'pratica' && (
          <div className="space-y-6">
            {questoes.length === 0 ? (
              <p className="text-center text-slate-300 text-sm py-8">
                Carregando questões da prática imediata...
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>
                    Questão {qIdx + 1} de {questoes.length}
                  </span>
                  <span>Prática Imediata</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mb-4">
                  {questoes[qIdx]?.enunciado}
                </p>
                <div className="space-y-2.5">
                  {(() => {
                    const q = questoes[qIdx]
                    if (!q) return null
                    let alts: string[] = []
                    try {
                      alts =
                        typeof q.alternativas === 'string'
                          ? JSON.parse(q.alternativas)
                          : q.alternativas
                    } catch {
                      alts = []
                    }
                    return alts.map((alt, idx) => {
                      let style =
                        'bg-slate-700/60 border-slate-600 hover:border-violet-400 text-slate-200'
                      if (answered) {
                        if (idx === q.gabarito)
                          style = 'bg-emerald-600/30 border-emerald-500 text-emerald-100 font-bold'
                        else if (selectedAlt === idx)
                          style = 'bg-rose-600/30 border-rose-500 text-rose-100 font-bold'
                      }
                      return (
                        <button
                          key={idx}
                          disabled={answered}
                          onClick={() => handleAnswer(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-200 ${style}`}
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
                      {selectedAlt === questoes[qIdx]?.gabarito ? (
                        <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Resposta Correta! +15 XP
                        </span>
                      ) : (
                        <span className="text-rose-400 font-extrabold text-sm flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Resposta Incorreta (salva no Banco de
                          Erros)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300">{questoes[qIdx]?.explicacao}</p>
                    <Button
                      size="sm"
                      onClick={nextQuestion}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl"
                    >
                      Próxima Questão
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {fase === 'pausa' && <BreathingCircle />}
      </div>
    </div>
  )
}
