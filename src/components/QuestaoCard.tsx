import { CheckCircle2, XCircle } from 'lucide-react'
import type { QuestaoRecord } from '@/services/questoes'
import { cn } from '@/lib/utils'

interface QuestaoCardProps {
  questao: QuestaoRecord
  selectedAnswer: number | undefined
  onAnswer: (questaoId: string, selectedIndex: number, gabarito: number) => void
}

export function QuestaoCard({ questao, selectedAnswer, onAnswer }: QuestaoCardProps) {
  let alternativas: string[] = []
  if (Array.isArray(questao.alternativas)) {
    alternativas = questao.alternativas
  } else {
    try {
      alternativas = JSON.parse(questao.alternativas || '[]')
    } catch {
      alternativas = []
    }
  }

  const answered = selectedAnswer !== undefined
  const isCorrect = answered && selectedAnswer === questao.gabarito

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
      <p className="text-sm font-bold text-slate-900">{questao.enunciado}</p>
      <div className="space-y-2">
        {alternativas.map((alt, idx) => {
          const isSelected = selectedAnswer === idx
          const isGabarito = idx === questao.gabarito
          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => onAnswer(questao.id, idx, questao.gabarito)}
              className={cn(
                'w-full text-left p-3 rounded-lg text-sm font-medium transition-all',
                !answered && 'hover:bg-violet-50 border border-slate-200 cursor-pointer',
                answered &&
                  isGabarito &&
                  'bg-emerald-50 border border-emerald-300 text-emerald-900',
                answered &&
                  isSelected &&
                  !isGabarito &&
                  'bg-red-50 border border-red-300 text-red-900',
                answered &&
                  !isSelected &&
                  !isGabarito &&
                  'border border-slate-200 text-slate-500 opacity-60',
              )}
            >
              {String.fromCharCode(65 + idx)}) {alt}
            </button>
          )
        })}
      </div>
      {answered && (
        <div
          className={cn(
            'p-3 rounded-lg text-sm',
            isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900',
          )}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isCorrect ? 'Correto!' : 'Incorreto'}
          </div>
          <p>{questao.explicacao}</p>
        </div>
      )}
    </div>
  )
}
