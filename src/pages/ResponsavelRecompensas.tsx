import { useEffect, useState } from 'react'
import { getRecompensas, updateRecompensa, RecompensaRecord } from '@/services/recompensas'
import { useRealtime } from '@/hooks/use-realtime'
import { Gift, Wallet, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

/**
 * Painel do RESPONSÁVEL — acompanhamento do acúmulo da recompensa do aluno
 * (R$ 15,00 por dia de estudo concluído, bônus de R$ 150,00 a cada ciclo de 10 dias).
 * Invisível para o aluno: acessado apenas pelas rotas /responsavel/*.
 */
export default function ResponsavelRecompensas() {
  const { toast } = useToast()
  const [recompensas, setRecompensas] = useState<RecompensaRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getRecompensas()
      setRecompensas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('recompensas', () => {
    loadData()
  })

  const available = recompensas.filter((r) => r.status === 'disponivel')
  const redeemed = recompensas.filter((r) => r.status === 'resgatada')
  const balance = available
    .filter((r) => r.tipo === 'dinheiro')
    .reduce((s, r) => s + (r.valor || 0), 0)
  const dailyRewards = recompensas.filter((r) => r.valor === 15)
  const completedDays = dailyRewards.length
  const daysToNextBonus = completedDays === 0 ? 10 : 10 - (completedDays % 10)

  const handleResgatar = async (id: string) => {
    try {
      await updateRecompensa(id, { status: 'resgatada' })
      toast({ title: 'Recompensa resgatada! 🎉' })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Recompensas</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Acompanhe o acúmulo da recompensa do aluno — visível apenas neste painel
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-violet-600 text-white shadow-elevation">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Saldo Disponível</h2>
        </div>
        <p className="text-4xl font-black">R$ {balance.toFixed(2).replace('.', ',')}</p>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-base font-extrabold text-foreground">Ciclo de Recompensas</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
              Por dia concluído
            </p>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">R$ 15,00</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">
              Bônus a cada 10 dias
            </p>
            <p className="text-2xl font-black text-amber-800 dark:text-amber-200">R$ 150,00</p>
          </div>
        </div>
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
            <span>Dias concluídos: {completedDays}</span>
            <span>Próximo bônus em {daysToNextBonus} dia(s)</span>
          </div>
          <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-violet-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedDays % 10) * 10}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Disponíveis para Resgate
        </h3>
        {available.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            Nenhuma recompensa disponível ainda. Aguarde o aluno concluir os dias de estudo.
          </p>
        ) : (
          available.map((r) => (
            <div
              key={r.id}
              className="bg-card p-4 rounded-xl border border-amber-500/30 shadow-subtle flex items-center gap-3"
            >
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {r.tipo === 'dinheiro' ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <Gift className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{r.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {r.tipo === 'dinheiro'
                    ? `R$ ${(r.valor || 0).toFixed(2)}`
                    : 'Recompensa especial'}{' '}
                  • {new Date(r.created).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleResgatar(r.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg h-8 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resgatar
              </Button>
            </div>
          ))
        )}
      </div>

      {redeemed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Já Resgatadas
          </h3>
          {redeemed.map((r) => (
            <div
              key={r.id}
              className="bg-card p-4 rounded-xl border border-border opacity-60 flex items-center gap-3"
            >
              <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                {r.tipo === 'dinheiro' ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <Gift className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-muted-foreground line-through truncate">
                  {r.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.tipo === 'dinheiro'
                    ? `R$ ${(r.valor || 0).toFixed(2)}`
                    : 'Recompensa especial'}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600">✓ Resgatada</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
