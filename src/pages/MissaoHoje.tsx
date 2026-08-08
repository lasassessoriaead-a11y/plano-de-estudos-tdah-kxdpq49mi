import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMissoesData, MissaoRecord } from '@/services/missoes'
import { SubjectBadge } from '@/components/SubjectBadge'
import { SprintOverlay } from '@/components/SprintOverlay'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { Play, CheckCircle2, Clock, Target } from 'lucide-react'

export default function MissaoHoje() {
  const [searchParams] = useSearchParams()
  const [missoes, setMissoes] = useState<MissaoRecord[]>([])
  const [activeMissao, setActiveMissao] = useState<MissaoRecord | null>(null)
  const hoje = new Date().toISOString().split('T')[0]

  const loadMissoes = async () => {
    try {
      const data = await getMissoesData(hoje)
      setMissoes(data)
      const urlId = searchParams.get('id')
      if (urlId && !activeMissao) {
        const found = data.find((m) => m.id === urlId)
        if (found) setActiveMissao(found)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadMissoes()
  }, [])

  useRealtime('missoes', () => loadMissoes())
  useRealtime('progresso', () => loadMissoes())

  const concluidas = missoes.filter((m) => m.status === 'concluida')
  const progresso = missoes.length > 0 ? (concluidas.length / missoes.length) * 100 : 0
  const proximaMissao = missoes.find((m) => m.status !== 'concluida')

  const handleComplete = () => {
    setActiveMissao(null)
    loadMissoes()
  }

  return (
    <div className="space-y-6">
      {activeMissao && (
        <SprintOverlay
          missao={activeMissao}
          onClose={() => setActiveMissao(null)}
          onComplete={handleComplete}
        />
      )}

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Missão de Hoje</h1>
        <p className="text-sm text-slate-600 font-medium mt-1">
          Sprints focados de 15 minutos (Teoria + Prática + Pausa)
        </p>
      </div>

      {missoes.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-bold text-slate-700">Progresso do Dia</span>
            </div>
            <span className="text-sm font-extrabold text-violet-600">
              {concluidas.length} de {missoes.length} concluídas
            </span>
          </div>
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-600 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
          {proximaMissao && (
            <p className="text-sm text-slate-600 font-medium mt-3">
              Próxima missão:{' '}
              <span className="font-bold text-slate-900">{proximaMissao.titulo}</span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missoes.map((m, idx) => {
          const isDone = m.status === 'concluida'
          const isNext = !isDone && m.id === proximaMissao?.id
          const mat = m.expand?.pildes_id?.expand?.topico_id?.expand?.materia_id
          return (
            <div
              key={m.id}
              className={`bg-white p-5 rounded-2xl border shadow-subtle hover:shadow-elevation transition-all space-y-4 flex flex-col justify-between ${isNext ? 'border-violet-400 ring-2 ring-violet-100' : 'border-slate-200'}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${isDone ? 'bg-emerald-100 text-emerald-700' : isNext ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    {mat && <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} />}
                  </div>
                  {isNext && (
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                      A seguir
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{m.titulo}</h3>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-bold ${isDone ? 'text-emerald-600' : 'text-slate-600'}`}
                >
                  {isDone ? '✓ Concluído' : '• Pendente'}
                </span>
                <Button
                  onClick={() => setActiveMissao(m)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isDone ? 'Refazer Sprint' : 'Iniciar Sprint'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {missoes.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">Nenhuma missão programada para hoje.</p>
        </div>
      )}
    </div>
  )
}
