import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { saveUserPreferences, getUserPreferences } from '@/services/premium'
import {
  getPerfilEstudo,
  savePerfilEstudo,
  OBJETIVO_LABELS,
  NIVEL_LABELS,
  PREFERENCIA_LABELS,
  ESTILO_LABELS,
  ObjetivoEstudo,
  NivelAtual,
  EstiloExplicacao,
  PreferenciaEstudo,
  PerfilEstudoRecord,
} from '@/services/perfil'
import { Loader2, Settings2, Target, Palette, GraduationCap } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

const opcoesPerfil = <T extends string>(
  valor: T,
  setValor: (v: T) => void,
  labels: Record<T, string>,
) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {(Object.keys(labels) as T[]).map((k) => (
      <button
        key={k}
        type="button"
        onClick={() => setValor(k)}
        className={`text-left px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
          valor === k
            ? 'border-blue-500 bg-blue-500/15 text-white'
            : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'
        }`}
      >
        {labels[k]}
      </button>
    ))}
  </div>
)

export default function Configuracoes() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [metaDiaria, setMetaDiaria] = useState<number[]>([60])
  const [metaSemanal, setMetaSemanal] = useState<number[]>([420])

  // Perfil de estudo (onboarding)
  const [perfil, setPerfil] = useState<PerfilEstudoRecord | null>(null)
  const [objetivo, setObjetivo] = useState<ObjetivoEstudo>('enem')
  const [horas, setHoras] = useState(2)
  const [materiasDificeis, setMateriasDificeis] = useState('')
  const [instituicoes, setInstituicoes] = useState('')
  const [dataProva, setDataProva] = useState('')
  const [nivel, setNivel] = useState<NivelAtual>('iniciante')
  const [estilo, setEstilo] = useState<EstiloExplicacao>('resumido')
  const [preferencia, setPreferencia] = useState<PreferenciaEstudo>('questoes')

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [prefs, p] = await Promise.all([
          getUserPreferences(user.id),
          getPerfilEstudo(user.id),
        ])
        if (prefs) {
          setMetaDiaria([prefs.meta_diaria_min || 60])
          setMetaSemanal([prefs.meta_semanal_min || 420])
        }
        if (p) {
          setPerfil(p)
          if (p.objetivo) setObjetivo(p.objetivo)
          setHoras(p.horas_por_dia ?? 2)
          setMateriasDificeis(p.materias_dificeis || '')
          setInstituicoes(p.instituicoes || '')
          setDataProva(p.data_prova || '')
          if (p.nivel_atual) setNivel(p.nivel_atual)
          if (p.estilo_explicacao) setEstilo(p.estilo_explicacao)
          if (p.preferencia_estudo) setPreferencia(p.preferencia_estudo)
        }
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

  const salvarPerfil = async () => {
    if (!user?.id) return
    setSavingPerfil(true)
    try {
      await savePerfilEstudo(user.id, {
        objetivo,
        horas_por_dia: horas,
        materias_dificeis: materiasDificeis,
        instituicoes,
        data_prova: dataProva,
        nivel_atual: nivel,
        estilo_explicacao: estilo,
        preferencia_estudo: preferencia,
        onboarding_concluido: true,
      })
      toast({ title: 'Perfil de estudo atualizado' })
    } catch (err) {
      toast({ title: 'Erro ao salvar perfil', description: String(err), variant: 'destructive' })
    } finally {
      setSavingPerfil(false)
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
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
        <Settings2 className="h-6 w-6 text-blue-400" /> Configurações
      </h1>

      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-blue-400" /> Perfil de estudo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-300">Objetivo</Label>
            {opcoesPerfil(objetivo, setObjetivo, OBJETIVO_LABELS)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Horas por dia</Label>
              <span className="text-sm font-extrabold text-blue-400">{horas}h</span>
            </div>
            <Slider
              value={[horas]}
              onValueChange={(v) => setHoras(v[0])}
              min={1}
              max={12}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Matérias mais difíceis</Label>
            <Input
              type="text"
              placeholder="Ex.: Física, Química, Redação..."
              value={materiasDificeis}
              onChange={(e) => setMateriasDificeis(e.target.value)}
              className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Instituições / provas</Label>
              <Input
                type="text"
                placeholder="Ex.: UNICAMP, ESA..."
                value={instituicoes}
                onChange={(e) => setInstituicoes(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Data prevista da prova</Label>
              <Input
                type="date"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
                className="bg-white/5 border-white/15 text-white focus-visible:ring-blue-500 rounded-xl [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Nível atual</Label>
            {opcoesPerfil(nivel, setNivel, NIVEL_LABELS)}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Estilo de explicação</Label>
            {opcoesPerfil<EstiloExplicacao>(estilo, setEstilo, ESTILO_LABELS)}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Preferência de estudo</Label>
            {opcoesPerfil(preferencia, setPreferencia, PREFERENCIA_LABELS)}
          </div>
          <Button
            onClick={salvarPerfil}
            disabled={savingPerfil}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl gap-1.5"
          >
            {savingPerfil && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar perfil de estudo
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="h-4 w-4 text-blue-400" /> Aparência
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
            A identidade NEXORA usa grafite com azul elétrico — o tema claro mantém contraste alto
            para leitura.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-blue-400" /> Metas de estudo
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
    </div>
  )
}
