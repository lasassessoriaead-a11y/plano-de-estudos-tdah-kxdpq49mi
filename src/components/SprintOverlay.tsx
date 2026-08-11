import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, BookOpen, Brain, Coffee } from 'lucide-react'
import { getPilde, type PildeRecord } from '@/services/pildes'
import { getQuestoesByPilde, updateQuestao, type QuestaoRecord } from '@/services/questoes'
import { upsertProgresso } from '@/services/progresso'
import { updateMissao, type MissaoRecord } from '@/services/missoes'
import { SubjectBadge } from '@/components/SubjectBadge'
import { QuestaoCard } from '@/components/QuestaoCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Phase = 'teoria' | 'pratica' | 'pausa'

const phases: { key: Phase; label: string; icon: typeof BookOpen }[] = [
  { key: 'teoria', label: 'Teoria', icon: BookOpen },
  { key: 'pratica', label: 'Prática', icon: Brain },
  { key: 'pausa', label: 'Pausa', icon: Coffee },
]

interface SprintOverlayProps {
  missao: MissaoRecord
  onClose: () => void
  onComplete: () => void
}

export function SprintOverlay({ missao, onClose, onComplete }: SprintOverlayProps) {
  const [phase, setPhase] = useState<Phase>('teoria')
  const [pilde, setPilde] = useState<PildeRecord | null>(null)
  const [questoes, setQuestoes] = useState<QuestaoRecord[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const p = await getPilde(missao.pildes_id)
        setPilde(p)
        const qs = await getQuestoesByPilde(missao.pildes_id)
        setQuestoes(qs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [missao.pildes_id])

  const handleAnswer = async (questaoId: string, selected: number, gabarito: number) => {
    setAnswers((prev) => ({ ...prev, [questaoId]: selected }))
    try {
      await updateQuestao(questaoId, { status: selected === gabarito ? 'acertou' : 'errou' })
    } catch (err) {
      console.error(err)
    }
  }

  const allAnswered = questoes.length > 0 && questoes.every((q) => answers[q.id] !== undefined)
  const mat = pilde?.expand?.topico_id?.expand?.materia_id
  const phaseIdx = phases.findIndex((p) => p.key === phase)

  const handleAdvance = async () => {
    if (phase === 'teoria') {
      await upsertProgresso(missao.id, 'teoria')
      setPhase('pratica')
    } else if (phase === 'pratica') {
      await upsertProgresso(missao.id, 'pratica')
      setPhase('pausa')
    } else {
      await upsertProgresso(missao.id, 'pausa')
      await updateMissao(missao.id, { status: 'concluida' })
      onComplete()
    }
  }

  const handleBack = () => {
    if (phase === 'pratica') setPhase('teoria')
    else if (phase === 'pausa') setPhase('pratica')
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {mat && <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} />}
          <h2 className="text-sm font-extrabold text-slate-900 truncate">{missao.titulo}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 shrink-0">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-4 py-3 bg-white border-b border-slate-100">
        {phases.map((p, i) => {
          const isActive = p.key === phase
          const isPast = phaseIdx > i
          return (
            <div key={p.key} className="flex items-center gap-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold',
                  isActive && 'bg-violet-600 text-white',
                  isPast && 'bg-emerald-100 text-emerald-700',
                  !isActive && !isPast && 'bg-slate-100 text-slate-500',
                )}
              >
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
              </div>
              {i < 2 && (
                <div className={cn('w-4 h-0.5', isPast ? 'bg-emerald-300' : 'bg-slate-200')} />
              )}
            </div>
          )
        })}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-sm text-slate-500 font-medium">Carregando...</p>
          </div>
        ) : phase === 'teoria' ? (
          <div
            className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900"
            dangerouslySetInnerHTML={{
              __html: pilde?.conteudo_teorico || '<p>Conteúdo não disponível.</p>',
            }}
          />
        ) : phase === 'pratica' ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-900">
              {questoes.length} questões — responda todas para avançar
            </p>
            {questoes.map((q, i) => (
              <div key={q.id}>
                <p className="text-xs font-bold text-slate-400 mb-1.5">Questão {i + 1}</p>
                <QuestaoCard questao={q} selectedAnswer={answers[q.id]} onAnswer={handleAnswer} />
              </div>
            ))}
            {questoes.length === 0 && (
              <p className="text-sm text-slate-500 font-medium text-center py-8">
                Nenhuma questão disponível.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <Coffee className="w-12 h-12 text-violet-400 mx-auto" />
            <h3 className="text-lg font-extrabold text-slate-900">Hora da Pausa!</h3>
            <p className="text-sm text-slate-600 font-medium">
              Respire fundo. Você merece este descanso.
            </p>
            <div className="bg-violet-50 rounded-2xl p-6 max-w-xs mx-auto">
              <p className="text-sm text-violet-900 font-medium">Respire 3 vezes:</p>
              <p className="text-xs text-violet-700 mt-1">
                Inspire (4s) → Segure (4s) → Expire (4s)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          {phase !== 'teoria' && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="font-bold text-sm rounded-xl flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
        </div>
        <Button
          onClick={handleAdvance}
          disabled={phase === 'pratica' && !allAnswered}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl flex items-center gap-1.5"
        >
          {phase === 'pausa' ? 'Concluir Sprint' : 'Avançar'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
