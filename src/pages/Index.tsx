import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMissoesData, MissaoRecord } from '@/services/missoes'
import { getMaterias, MateriaRecord } from '@/services/materias'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import {
  Target,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Star,
  BookOpenCheck,
  ArrowRight,
} from 'lucide-react'

export default function Index() {
  const { user } = useAuth()
  const [missoes, setMissoes] = useState<MissaoRecord[]>([])
  const [materias, setMaterias] = useState<MateriaRecord[]>([])
  const [xp, setXp] = useState<number>(() =>
    parseInt(localStorage.getItem('tdah_med_xp') || '250', 10),
  )
  const [streak, setStreak] = useState<number>(() =>
    parseInt(localStorage.getItem('tdah_med_streak') || '4', 10),
  )

  const hoje = new Date().toISOString().split('T')[0]

  const loadData = async () => {
    try {
      const [mList, matList] = await Promise.all([getMissoesData(hoje), getMaterias()])
      setMissoes(mList)
      setMaterias(matList)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleStorage = () => {
      setXp(parseInt(localStorage.getItem('tdah_med_xp') || '250', 10))
      setStreak(parseInt(localStorage.getItem('tdah_med_streak') || '4', 10))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useRealtime('missoes', () => {
    loadData()
  })

  const concluidas = missoes.filter((m) => m.status === 'concluida').length
  const pendentes = missoes.filter((m) => m.status !== 'concluida').length
  const progresso = missoes.length > 0 ? Math.round((concluidas / missoes.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Olá, {user?.name || 'Luis Gustavo'}! 👋
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Pronto para mais um dia de sprints focados?
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Sequência</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{streak} dias</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
              <Star className="w-4 h-4 fill-violet-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">XP Total</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{xp}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Concluídas</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{concluidas}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pendentes</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{pendentes}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            <h2 className="text-base font-extrabold text-slate-900">Progresso de Hoje</h2>
          </div>
          <Link to="/missao">
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Ir para Missões
            </Button>
          </Link>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-violet-600 to-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {concluidas} de {missoes.length} missões concluídas ({progresso}%)
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-violet-600" />
          <h2 className="text-base font-extrabold text-slate-900">Matérias em Foco</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {materias.slice(0, 6).map((m) => (
            <Link
              key={m.id}
              to="/plano"
              className="px-3 py-2 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: m.cor || '#8B5CF6' }}
              />
              <span className="text-xs font-bold text-slate-700">{m.nome}</span>
            </Link>
          ))}
        </div>
        <Link
          to="/plano"
          className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1 pt-1"
        >
          Ver plano completo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
