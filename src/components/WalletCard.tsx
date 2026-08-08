import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRecompensas, RecompensaRecord } from '@/services/recompensas'
import { useRealtime } from '@/hooks/use-realtime'
import { Wallet, Gift, ArrowRight } from 'lucide-react'

export function WalletCard() {
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

  const earned = recompensas.filter(
    (r) => r.status === 'disponivel' && r.expand?.missao_id?.status === 'concluida',
  )
  const balance = earned
    .filter((r) => r.tipo === 'dinheiro')
    .reduce((sum, r) => sum + (r.valor || 0), 0)

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Carteira de Recompensas</h3>
            <p className="text-xs text-slate-500 font-semibold">Saldo acumulado por metas</p>
          </div>
        </div>
        <Link
          to="/recompensas"
          className="text-xs font-extrabold text-amber-600 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <span>Histórico</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-violet-50 border border-amber-100">
        <p className="text-xs text-slate-500 font-semibold mb-1">Saldo Disponível</p>
        <p className="text-3xl font-black text-slate-900">
          R$ {balance.toFixed(2).replace('.', ',')}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700">Recompensas Recentes</p>
        {earned.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            Complete missões com recompensas para ganhar!
          </p>
        ) : (
          earned.slice(0, 3).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
            >
              <Gift className="w-4 h-4 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{r.titulo}</p>
                <p className="text-[10px] text-slate-500">
                  {r.tipo === 'dinheiro'
                    ? `R$ ${(r.valor || 0).toFixed(2)}`
                    : 'Recompensa especial'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
