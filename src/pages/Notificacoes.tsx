import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRecord,
} from '@/services/premium'
import { Bell, CheckCheck, Check, Inbox, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type Filter = 'todas' | 'nao_lidas' | 'lidas'

export default function Notificacoes() {
  const { user } = useAuth()
  const [items, setItems] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('todas')

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const list = await getNotifications(user.id)
      setItems(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const unreadCount = items.filter((n) => !n.lida).length

  const filtered = useMemo(() => {
    if (filter === 'nao_lidas') return items.filter((n) => !n.lida)
    if (filter === 'lidas') return items.filter((n) => n.lida)
    return items
  }, [items, filter])

  const handleReadOne = async (n: NotificationRecord) => {
    if (n.lida) return
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)))
    try {
      await markNotificationRead(n.id)
    } catch {
      load()
    }
  }

  const handleReadAll = async () => {
    const unreadIds = items.filter((n) => !n.lida).map((n) => n.id)
    if (unreadIds.length === 0) return
    setItems((prev) => prev.map((x) => ({ ...x, lida: true })))
    try {
      await Promise.all(unreadIds.map((id) => markNotificationRead(id)))
    } catch {
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {loading
              ? 'Carregando...'
              : unreadCount > 0
                ? `${unreadCount} notificação${unreadCount > 1 ? 'es' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                : 'Você está em dia com suas notificações'}
          </p>
        </div>
        <Button
          onClick={handleReadAll}
          disabled={loading || unreadCount === 0}
          className="rounded-xl font-bold text-sm self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 mr-1.5" />
          Marcar todas como lidas
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(
          [
            { key: 'todas', label: 'Todas' },
            { key: 'nao_lidas', label: 'Não lidas' },
            { key: 'lidas', label: 'Lidas' },
          ] as { key: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-bold border transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card"
              >
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="p-10 rounded-2xl border border-border bg-card text-center space-y-3">
            {filter === 'nao_lidas' ? (
              <BellOff className="w-10 h-10 text-muted-foreground mx-auto" />
            ) : (
              <Inbox className="w-10 h-10 text-muted-foreground mx-auto" />
            )}
            <h3 className="text-base font-bold text-foreground">
              {filter === 'nao_lidas'
                ? 'Nenhuma notificação não lida'
                : filter === 'lidas'
                  ? 'Nenhuma notificação lida ainda'
                  : 'Nenhuma notificação por aqui'}
            </h3>
            <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">
              {filter === 'todas'
                ? 'Seus avisos de estudo, conquistas e lembretes aparecem aqui à medida que você avança no plano.'
                : filter === 'nao_lidas'
                  ? 'Tudo lido! Volte mais tarde para conferir novos avisos.'
                  : 'Ao ler uma notificação, ela aparece nesta lista.'}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border bg-card transition-colors',
                n.lida ? 'border-border opacity-75' : 'border-primary/40 ring-1 ring-primary/10',
              )}
            >
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  n.lida ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                )}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{n.titulo}</p>
                  {n.created && (
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                      {new Date(n.created).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {n.mensagem && (
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">{n.mensagem}</p>
                )}
              </div>
              {!n.lida && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReadOne(n)}
                  className="rounded-lg text-xs font-bold shrink-0"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Marcar lida
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
