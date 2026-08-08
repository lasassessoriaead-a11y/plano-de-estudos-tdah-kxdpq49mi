import { useState, useEffect } from 'react'
import { getRecompensas, updateRecompensa, RecompensaRecord } from '@/services/recompensas'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Gift, Wallet, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Recompensas() {
  const { toast } = useToast()
  const [recompensas, setRecompensas] = useState<RecompensaRecord[]>([])

  const loadData = async () => {
    try {
      const data = await getRecompensas()
      setRecompensas(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('recompensas', () => {
    loadData()
  })

  const earned = recompensas.filter((r) => r.expand?.missao_id?.status === 'concluida')
  const balance = earned
    .filter((r) => r.tipo === 'dinheiro' && r.status === 'disponivel')
    .reduce((s, r) => s + (r.valor || 0), 0)
  const pending = recompensas.filter((r) => r.expand?.missao_id?.status !== 'concluida')

  const handleResgatar = async (id: string) => {
    try {
      await updateRecompensa(id, { status: 'resgatada' })
      toast({ title: 'Recompensa resgatada! 🎉' })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recompensas</h1>
        <p className="text-xs text-slate-500 font-medium">
          Suas recompensas por concluir missões de estudo
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-violet-600 text-white shadow-elevation">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Saldo Disponível</h2>
        </div>
        <p className="text-4xl font-black">R$ {balance.toFixed(2).replace('.', ',')}</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Pendentes
          </h3>
          {pending.map((r) => (
            <div
              key={r.id}
              className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 opacity-75"
            >
              <Gift className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{r.titulo}</p>
                <p className="text-xs text-slate-400">
                  {r.tipo === 'dinheiro'
                    ? `R$ ${(r.valor || 0).toFixed(2)}`
                    : 'Recompensa especial'}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">Pendente</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Recompensas Ganhas
        </h3>
        {earned.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Nenhuma recompensa ganha ainda. Complete missões com recompensas configuradas!
          </p>
        ) : (
          earned.map((r) => (
            <div
              key={r.id}
              className={`bg-white p-4 rounded-xl border flex items-center gap-3 ${
                r.status === 'resgatada'
                  ? 'border-slate-200 opacity-60'
                  : 'border-amber-200 shadow-subtle'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  r.status === 'resgatada'
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {r.tipo === 'dinheiro' ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <Gift className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold truncate ${
                    r.status === 'resgatada' ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {r.titulo}
                </p>
                <p className="text-xs text-slate-500">
                  {r.tipo === 'dinheiro'
                    ? `R$ ${(r.valor || 0).toFixed(2)}`
                    : 'Recompensa especial'}{' '}
                  • {new Date(r.created).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {r.status === 'disponivel' && (
                <Button
                  size="sm"
                  onClick={() => handleResgatar(r.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg h-8"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resgatar
                </Button>
              )}
              {r.status === 'resgatada' && (
                <span className="text-xs font-bold text-emerald-600">✓ Resgatada</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
