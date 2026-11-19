import { useEffect, useMemo, useState } from 'react'
import { getRecompensas, RecompensaRecord } from '@/services/recompensas'
import { getMissoes, MissaoRecord } from '@/services/missoes'
import { useRealtime } from '@/hooks/use-realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { Gift, Wallet, TrendingUp, CalendarCheck } from 'lucide-react'

/**
 * Painel inicial do RESPONSÁVEL — resumo do acúmulo invisível da recompensa do aluno
 * (R$ 15,00 por dia de estudo concluído, bônus de R$ 150,00 a cada ciclo de 10 dias).
 * Não expõe XP, moedas, medalhas ou ranking ao aluno — é um painel separado, papel "responsavel".
 */
export default function ResponsavelHome() {
  const [recompensas, setRecompensas] = useState<RecompensaRecord[]>([])
  const [missoes, setMissoes] = useState<MissaoRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [r, m] = await Promise.all([getRecompensas(), getMissoes()])
        setRecompensas(r)
        setMissoes(m)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useRealtime('recompensas', () => {
    getRecompensas().then(setRecompensas).catch(console.error)
  })

  const available = useMemo(
    () => recompensas.filter((r) => r.status === 'disponivel'),
    [recompensas],
  )
  const redeemed = useMemo(() => recompensas.filter((r) => r.status === 'resgatada'), [recompensas])

  const saldo = available
    .filter((r) => r.tipo === 'dinheiro')
    .reduce((s, r) => s + (r.valor || 0), 0)
  const totalAcumulado = recompensas
    .filter((r) => r.tipo === 'dinheiro')
    .reduce((s, r) => s + (r.valor || 0), 0)
  const dailyRewards = recompensas.filter((r) => r.valor === 15)
  const completedDays = dailyRewards.length
  const daysToNextBonus = completedDays === 0 ? 10 : 10 - (completedDays % 10)
  const cicloAtual = completedDays === 0 ? 0 : ((completedDays - 1) % 10) + 1
  const missoesConcluidas = missoes.filter((m) => m.status === 'concluida').length

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel do Responsável</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Acompanhamento do acúmulo da recompensa por dias de estudo concluídos
        </p>
      </div>

      {/* Saldo invisível ao aluno */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-violet-600 text-white shadow-elevation">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Saldo Acumulado Disponível</h2>
        </div>
        <p className="text-4xl font-black">R$ {saldo.toFixed(2).replace('.', ',')}</p>
        <p className="text-xs text-amber-100 font-semibold mt-1">
          Total já gerado desde o início: R$ {totalAcumulado.toFixed(2).replace('.', ',')} •
          Resgatado: R${' '}
          {redeemed
            .filter((r) => r.tipo === 'dinheiro')
            .reduce((s, r) => s + (r.valor || 0), 0)
            .toFixed(2)
            .replace('.', ',')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Ciclo atual</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {cicloAtual}
            <span className="text-base font-bold text-slate-400">/10 dias</span>
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Próximo bônus de R$ 150,00 em {daysToNextBonus} dia(s)
          </p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-violet-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${cicloAtual * 10}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Dias de estudo concluídos</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{completedDays}</p>
          <p className="text-xs text-slate-500 font-medium">
            R$ 15,00 por dia concluído • bônus de R$ 150,00 a cada ciclo de 10 dias
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-extrabold text-slate-900">Recompensas disponíveis</h3>
        </div>
        {available.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3">
            Nenhuma recompensa disponível ainda. Elas são geradas automaticamente quando o aluno
            conclui os dias de estudo.
          </p>
        ) : (
          <div className="space-y-2">
            {available.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
              >
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm font-bold text-slate-800 truncate flex-1">{r.titulo}</p>
                <span className="text-xs font-black text-emerald-700 shrink-0">
                  {r.tipo === 'dinheiro' ? `R$ ${(r.valor || 0).toFixed(2)}` : 'Especial'}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400">
          Missões concluídas no total: <span className="font-bold">{missoesConcluidas}</span>
        </p>
      </div>
    </div>
  )
}
