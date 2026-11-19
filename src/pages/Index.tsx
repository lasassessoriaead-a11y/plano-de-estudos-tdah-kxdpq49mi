import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMissoesData, MissaoRecord } from '@/services/missoes'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { SubjectBadge } from '@/components/SubjectBadge'
import { Target, Flame, Play, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function Index() {
  const { user } = useAuth()
  const [missoes, setMissoes] = useState<MissaoRecord[]>([])
  const hoje = new Date().toISOString().split('T')[0]

  const loadMissoes = async () => {
    try {
      const data = await getMissoesData(hoje)
      setMissoes(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadMissoes()
  }, [])
  useRealtime('missoes', () => loadMissoes())

  const streak = parseInt(localStorage.getItem('tdah_med_streak') || '4', 10)

  const concluidas = missoes.filter((m) => m.status === 'concluida')
  const pendentes = missoes.filter((m) => m.status !== 'concluida')
  const proximaMissao = pendentes[0]
  const progresso = missoes.length > 0 ? (concluidas.length / missoes.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          Olá, {user?.name?.split(' ')[0] || 'Estudante'}
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-muted-foreground">Sequência</span>
          </div>
          <p className="text-xl font-black text-foreground">{streak} dias</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            <span className="text-xs font-bold text-muted-foreground">Missões de hoje</span>
          </div>
          <p className="text-xl font-black text-foreground">{missoes.length}</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-muted-foreground">Concluídas</span>
          </div>
          <p className="text-xl font-black text-foreground">
            {concluidas.length}/{missoes.length}
          </p>
        </div>
      </div>

      {proximaMissao ? (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl border border-blue-500/30 shadow-[0_0_40px_-15px_rgba(37,99,235,0.7)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-200" />
            <span className="text-sm font-bold text-blue-100">Próxima Missão</span>
          </div>
          <h2 className="text-lg font-black text-white mb-1">{proximaMissao.titulo}</h2>
          {/* card azul: texto branco ok nos dois temas */}
          <p className="text-sm text-blue-200 mb-4">
            Sprint focado de 15 minutos para avançar no plano
          </p>
          <Link to={`/missao?id=${proximaMissao.id}`}>
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-xl">
              <Play className="w-4 h-4 fill-blue-700 mr-1.5" />
              Iniciar Sprint
            </Button>
          </Link>
        </div>
      ) : missoes.length > 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-300">
              Tudo concluído hoje
            </h2>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-200/80 font-medium">
            Você completou todas as missões de hoje. Volte amanhã para novos desafios!
          </p>
        </div>
      ) : null}

      {missoes.length > 0 && (
        <div className="bg-card p-5 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-muted-foreground">Progresso de Hoje</span>
            <span className="text-sm font-extrabold text-primary">{Math.round(progresso)}%</span>
          </div>
          <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {missoes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Missões de Hoje</h3>
          {missoes.map((m, idx) => {
            const isDone = m.status === 'concluida'
            const mat = m.expand?.pildes_id?.expand?.topico_id?.expand?.materia_id
            return (
              <Link
                key={m.id}
                to={`/missao?id=${m.id}`}
                className="block bg-card p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500/15' : 'bg-blue-500/15'}`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="text-sm font-black text-primary">{idx + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${isDone ? 'text-muted-foreground' : 'text-foreground'}`}
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
                  <div className="shrink-0">
                    {isDone ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        Concluída
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 15 min
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
