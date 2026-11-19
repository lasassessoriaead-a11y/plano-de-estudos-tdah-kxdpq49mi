import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  saveUserPreferences,
  getUserPreferences,
  summarizeXp,
  getXpTransactions,
} from '@/services/premium'
import { Loader2, Settings2, Target, Trophy, Zap, Palette } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export default function Configuracoes() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [metaDiaria, setMetaDiaria] = useState<number[]>([60])
  const [metaSemanal, setMetaSemanal] = useState<number[]>([420])
  const [xp, setXp] = useState({ xpTotal: 0, nivel: 1, xpNoNivel: 0, xpProximoNivel: 500 })

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const prefs = await getUserPreferences(user.id)
        if (prefs) {
          setMetaDiaria([prefs.meta_diaria_min || 60])
          setMetaSemanal([prefs.meta_semanal_min || 420])
        }
        const txs = await getXpTransactions(user.id)
        setXp(summarizeXp(txs))
      } catch (err) {
        toast({
          title: 'Erro ao carregar preferências',
          description: String(err),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.id])

  const salvar = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await saveUserPreferences(user.id, {
        meta_diaria_min: metaDiaria[0],
        meta_semanal_min: metaSemanal[0],
      })
      toast({ title: 'Preferências salvas' })
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Settings2 className="h-6 w-6 text-primary" /> Configurações
      </h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="h-4 w-4 text-primary" /> Aparência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex-1"
            >
              Tema escuro
            </Button>
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex-1"
            >
              Tema claro
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Escolha o tema com melhor legibilidade para você — a preferência fica salva neste
            dispositivo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" /> Metas de estudo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label>Meta diária</Label>
              <span className="text-sm font-semibold tabular-nums">{metaDiaria[0]} min</span>
            </div>
            <Slider
              className="mt-2"
              value={metaDiaria}
              onValueChange={setMetaDiaria}
              max={300}
              step={15}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Meta semanal</Label>
              <span className="text-sm font-semibold tabular-nums">{metaSemanal[0]} min</span>
            </div>
            <Slider
              className="mt-2"
              value={metaSemanal}
              onValueChange={setMetaSemanal}
              max={2100}
              step={30}
            />
          </div>
          <Button onClick={salvar} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar metas
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" /> XP e conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1">
              <Trophy className="h-3 w-3" /> Nível {xp.nivel}
            </Badge>
            <Badge variant="secondary">{xp.xpTotal} XP total</Badge>
            <Badge variant="outline">
              {xp.xpNoNivel}/{xp.xpProximoNivel} XP no nível
            </Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            O XP é calculado no servidor a cada missão concluída (100 XP) e questão respondida (10
            XP). Conquistas são desbloqueadas automaticamente conforme seu progresso real.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
