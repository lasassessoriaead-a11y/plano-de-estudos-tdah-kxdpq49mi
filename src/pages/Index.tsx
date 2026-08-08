import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getMissoesData, updateMissao, MissaoRecord } from '@/services/missoes'
import { getQuestoesRevisao, QuestaoRecord } from '@/services/questoes'
import { getMaterias, MateriaRecord } from '@/services/materias'
import { SubjectBadge } from '@/components/SubjectBadge'
import { Confetti } from '@/components/Confetti'
import { WalletCard } from '@/components/WalletCard'
import {
  Target,
  Flame,
  Star,
  CheckCircle2,
  Circle,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const quotes = [
  'A disciplina vence a motivação quando o foco está em pequenos passos.',
  'Sprints curtos mantêm o cérebro afiado e evitam a sobrecarga!',
  'Cada questão errada é uma oportunidade de acerto no dia da prova!',
  'Foco no processo: 15 minutos por vez constroem a vaga em Medicina.',
]

export default function Index() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [missoes, setMissoes] = useState<MissaoRecord[]>([])
  const [errosRevisao, setErrosRevisao] = useState<QuestaoRecord[]>([])
  const [materias, setMaterias] = useState<MateriaRecord[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)])

  const hoje = new Date().toISOString().split('T')[0]

  const loadData = async () => {
    try {
      const [mList, eList, matList] = await Promise.all([
        getMissoesData(hoje),
        getQuestoesRevisao(),
        getMaterias(),
      ])
      setMissoes(mList)
      setErrosRevisao(eList.slice(0, 3))
      setMaterias(matList)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('missoes', () => {
    loadData()
  })

  useRealtime('questoes', () => {
    loadData()
  })

  const concluídasCount = missoes.filter((m) => m.status === 'concluida').length
  const totalCount = missoes.length || 1
  const pctDiario = Math.round((concluídasCount / totalCount) * 100)

  const handleToggleMissao = async (m: MissaoRecord) => {
    const newStatus = m.status === 'concluida' ? 'pendente' : 'concluida'
    try {
      await updateMissao(m.id, { status: newStatus })
      setMissoes((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: newStatus } : item)),
      )

      if (newStatus === 'concluida') {
        const currentXp = parseInt(localStorage.getItem('tdah_med_xp') || '250', 10)
        localStorage.setItem('tdah_med_xp', String(currentXp + 50))
        window.dispatchEvent(new Event('storage'))

        toast({
          title: 'Missão concluída! 🎉',
          description: '+50 XP para sua jornada em Medicina.',
        })

        if (concluídasCount + 1 === missoes.length) {
          setShowConfetti(true)
          toast({
            title: 'Parabéns! Todas as missões do dia foram cumpridas! 🔥',
            description: 'Seu cérebro deu um show hoje.',
          })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const diaAtualIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}

      {/* Welcome Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 text-white shadow-elevation relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Método TDAH • Sprints de 15 min</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bora estudar, {user?.name?.split(' ')[0] || 'Futuro Médico'}! 🔥
          </h1>
          <p className="text-xs sm:text-sm text-violet-100 font-medium italic">"{quote}"</p>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Missão de Hoje */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Missões de Hoje</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {concluídasCount} de {missoes.length} completadas ({pctDiario}%)
                </p>
              </div>
            </div>
            <Link
              to="/missao"
              className="text-xs font-extrabold text-violet-600 hover:text-violet-800 flex items-center gap-1 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progresso Ring Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-violet-600 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pctDiario}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2.5">
            {missoes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Nenhuma missão agendada para hoje.
              </p>
            ) : (
              missoes.map((m) => {
                const isDone = m.status === 'concluida'
                const mat = m.expand?.pildes_id?.expand?.topico_id?.expand?.materia_id
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 hover:border-violet-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleMissao(m)}
                        className="text-violet-600 hover:scale-110 transition-transform shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-violet-500" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {m.titulo}
                        </p>
                        {mat && (
                          <div className="mt-1">
                            <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} />
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/missao?id=${m.id}`)}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl h-8 px-3 shrink-0"
                    >
                      Iniciar Sprint
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Calendário Semanal + Mentor Coruja */}
        <div className="space-y-6">
          {/* Card Planejamento Semanal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Semana de Foco</h3>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {diasSemana.map((d, i) => {
                const isHoje = i === diaAtualIdx
                return (
                  <div
                    key={d}
                    className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 ${
                      isHoje
                        ? 'bg-violet-600 text-white font-black shadow-md'
                        : 'bg-slate-50 text-slate-600 border border-slate-100 font-semibold'
                    }`}
                  >
                    <span>{d}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isHoje
                          ? 'bg-amber-400'
                          : i < diaAtualIdx
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                      }`}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card Mentor Coruja */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 border border-purple-200 shadow-subtle space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                🦉
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Coruja Mentora</h4>
                <p className="text-[11px] font-semibold text-slate-500">
                  Tire dúvidas ou corrija micro-redações
                </p>
              </div>
            </div>
            <Link
              to="/chat"
              className="w-full py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Falar com a Coruja</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Wallet / Recompensas */}
      <WalletCard />

      {/* Grid Inferior: Progresso por Matéria + Banco de Erros Atalho */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progresso por Matéria */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Peso no Vestibular Medicina</h3>
          <div className="space-y-3">
            {materias.slice(0, 5).map((mat) => (
              <div key={mat.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: mat.cor || '#7C3AED' }}
                    />
                    <span>{mat.nome}</span>
                  </span>
                  <span className="text-slate-500">Peso {mat.peso || 1}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(mat.peso || 1) * 30}%`,
                      backgroundColor: mat.cor || '#7C3AED',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atalho Revisar Hoje */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Revisar Hoje (Banco de Erros)
              </h3>
            </div>
            <Link to="/erros" className="text-xs font-bold text-rose-600 hover:underline">
              Ver banco
            </Link>
          </div>

          {errosRevisao.length === 0 ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold text-center">
              🎉 Nenhum erro pendente de revisão para hoje!
            </div>
          ) : (
            <div className="space-y-2.5">
              {errosRevisao.map((q) => (
                <div
                  key={q.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <p className="font-semibold text-slate-800 line-clamp-2">{q.enunciado}</p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/erros')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg h-7 px-2.5 shrink-0"
                  >
                    Revisar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
