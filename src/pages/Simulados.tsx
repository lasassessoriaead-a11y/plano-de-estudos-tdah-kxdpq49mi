import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Clock,
  Target,
  TrendingUp,
  History,
  Plus,
  Trophy,
  Sparkles,
  Settings2,
  Trash2,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  AREA_LABEL,
  AREAS,
  type SimArea,
  type SimuladoRecord,
  type TentativaRecord,
  contarQuestoesDisponiveis,
  createSimulado,
  deleteSimulado,
  getAnosDisponiveis,
  listSimulados,
  listTentativas,
  parseQuestoesIds,
  sortearQuestoes,
  formatarTempo,
  getPrimeiroTemaRedacao,
} from '@/services/simulados'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const PRESETS = [
  {
    tipo: 'enem_dia1' as const,
    titulo: 'ENEM — Primeiro Dia',
    desc: '45 Linguagens + 45 Ciências Humanas (90 questões) + Redação',
    icone: FileText,
    cor: 'text-violet-600',
    bg: 'bg-violet-100',
  },
  {
    tipo: 'enem_dia2' as const,
    titulo: 'ENEM — Segundo Dia',
    desc: '45 Ciências da Natureza + 45 Matemática (90 questões)',
    icone: FileText,
    cor: 'text-blue-600',
    bg: 'bg-blue-100',
  },
]

const AREA_PRESETS: { area: SimArea; desc: string; cor: string; bg: string }[] = [
  { area: 'linguagens', desc: 'Treino: 12 questões', cor: 'text-violet-600', bg: 'bg-violet-100' },
  { area: 'humanas', desc: 'Treino: 12 questões', cor: 'text-amber-600', bg: 'bg-amber-100' },
  { area: 'natureza', desc: 'Treino: 12 questões', cor: 'text-emerald-600', bg: 'bg-emerald-100' },
  { area: 'matematica', desc: 'Treino: 12 questões', cor: 'text-blue-600', bg: 'bg-blue-100' },
]

export default function Simulados() {
  const { toast } = useToast()
  const [simulados, setSimulados] = useState<SimuladoRecord[]>([])
  const [tentativas, setTentativas] = useState<TentativaRecord[]>([])
  const [banco, setBanco] = useState(0)
  const [anos, setAnos] = useState<number[]>([])
  const [filtroArea, setFiltroArea] = useState<'todas' | SimArea>('todas')
  const [filtroAno, setFiltroAno] = useState<'todos' | string>('todos')
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)

  // Personalizado
  const [area, setArea] = useState<SimArea>('linguagens')
  const [quantidade, setQuantidade] = useState(10)
  const [dificuldade, setDificuldade] = useState<'todas' | 'facil' | 'medio' | 'dificil'>('todas')
  const [ano, setAno] = useState<'todos' | string>('todos')
  const [duracao, setDuracao] = useState(30)

  const finalizadas = useMemo(
    () => tentativas.filter((t) => t.status === 'finalizada'),
    [tentativas],
  )
  const emAndamento = useMemo(
    () => tentativas.find((t) => t.status === 'em_andamento'),
    [tentativas],
  )

  // pct por tentativa: recalcular a partir do simulado não é possível sem as questões,
  // então gravamos pct_acerto na tentativa ao finalizar (ver Prova.tsx).
  const metricas = useMemo(() => {
    const totalQ = finalizadas.reduce(
      (acc, t) => acc + (t.expand?.simulado_id ? parseQuestoesIds(t.expand.simulado_id).length : 0),
      0,
    )
    const pctMedio = finalizadas.length
      ? Math.round(
          finalizadas.reduce((acc, t) => acc + (t.pct_acerto ?? 0), 0) / finalizadas.length,
        )
      : 0
    return { totalQ, pctMedio }
  }, [finalizadas])

  // Evolução: pct por tentativa na ordem cronológica
  const evolucao = useMemo(
    () =>
      [...finalizadas]
        .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
        .map((t) => ({ pct: t.pct_acerto ?? 0, created: t.created })),
    [finalizadas],
  )

  const melhorResultado = useMemo(() => Math.max(0, ...evolucao.map((e) => e.pct)), [evolucao])

  const simuladosFiltrados = useMemo(() => {
    return simulados.filter((s) => {
      if (s.tipo === 'enem_dia1' || s.tipo === 'enem_dia2') return filtroArea === 'todas'
      const cfg = typeof s.config_json === 'string' ? JSON.parse(s.config_json) : s.config_json
      const matchArea = filtroArea === 'todas' || cfg?.area === filtroArea
      const cfgAno = cfg?.ano ? String(cfg.ano) : 'todos'
      const matchAno = filtroAno === 'todos' || cfgAno === filtroAno
      return matchArea && matchAno
    })
  }, [simulados, filtroArea, filtroAno])

  const carregar = async () => {
    setLoading(true)
    try {
      const [sims, tents, bancoN, anosL] = await Promise.all([
        listSimulados(),
        listTentativas(),
        contarQuestoesDisponiveis(),
        getAnosDisponiveis(),
      ])
      setSimulados(sims)
      setTentativas(tents)
      setBanco(bancoN)
      setAnos(anosL)
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os simulados.',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const iniciarPreset = async (tipo: 'enem_dia1' | 'enem_dia2') => {
    setCriando(true)
    try {
      const areasLista: SimArea[] =
        tipo === 'enem_dia1' ? ['linguagens', 'humanas'] : ['natureza', 'matematica']
      const ids: string[] = []
      for (const a of areasLista) {
        const qs = await sortearQuestoes({ area: a }, 45)
        if (qs.length < 45) {
          toast({
            title: 'Banco insuficiente',
            description: `A área ${AREA_LABEL[a]} tem apenas ${qs.length} questões no banco. Faltam questões autorais para o ENEM completo — use os simulados de treino por área ou o personalizado.`,
            variant: 'destructive',
          })
          setCriando(false)
          return
        }
        ids.push(...qs.map((q) => q.id))
      }
      // só o 1º dia completo inclui a redação
      let incluirRedacao = false
      let temaRedacaoId: string | undefined
      if (tipo === 'enem_dia1') {
        const tema = await getPrimeiroTemaRedacao()
        if (tema) {
          incluirRedacao = true
          temaRedacaoId = tema.id
        }
      }
      const sim = await createSimulado({
        titulo: tipo === 'enem_dia1' ? 'ENEM — Primeiro Dia' : 'ENEM — Segundo Dia',
        tipo,
        config: {},
        questoesIds: ids,
        duracaoMin: 270,
        incluirRedacao,
        temaRedacaoId,
      })
      toast({
        title: 'Simulado criado!',
        description: incluirRedacao ? 'Boa prova — e boa redação!' : 'Boa prova!',
      })
      window.location.href = `/simulados/enem/prova/${sim.id}`
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o simulado.',
        variant: 'destructive',
      })
      setCriando(false)
    }
  }

  const iniciarArea = async (areaSel: SimArea) => {
    setCriando(true)
    try {
      const qs = await sortearQuestoes({ area: areaSel }, 12)
      if (!qs.length) {
        toast({
          title: 'Sem questões',
          description: `Não há questões de ${AREA_LABEL[areaSel]} no banco.`,
          variant: 'destructive',
        })
        setCriando(false)
        return
      }
      const sim = await createSimulado({
        titulo: `Treino — ${AREA_LABEL[areaSel]}`,
        tipo: 'area',
        config: { area: areaSel },
        questoesIds: qs.map((q) => q.id),
        duracaoMin: 30,
      })
      window.location.href = `/simulados/enem/prova/${sim.id}`
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o simulado.',
        variant: 'destructive',
      })
      setCriando(false)
    }
  }

  const criarPersonalizado = async () => {
    setCriando(true)
    try {
      const qs = await sortearQuestoes(
        { area, dificuldade, ano: ano === 'todos' ? undefined : Number(ano) },
        quantidade,
      )
      if (!qs.length) {
        toast({
          title: 'Sem questões',
          description: 'Nenhuma questão encontrada com esses filtros.',
          variant: 'destructive',
        })
        setCriando(false)
        return
      }
      const sim = await createSimulado({
        titulo: `Personalizado — ${AREA_LABEL[area]} (${qs.length}q)`,
        tipo: 'personalizado',
        config: { area, dificuldade, ano: ano === 'todos' ? undefined : Number(ano) },
        questoesIds: qs.map((q) => q.id),
        duracaoMin: Math.max(5, Math.min(600, duracao)),
      })
      toast({ title: 'Simulado criado!', description: 'Boa prova!' })
      window.location.href = `/simulados/enem/prova/${sim.id}`
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o simulado.',
        variant: 'destructive',
      })
      setCriando(false)
    }
  }

  const remover = async (id: string) => {
    try {
      await deleteSimulado(id)
      toast({ title: 'Simulado excluído', description: 'Removido da lista.' })
      await carregar()
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' })
    }
  }

  const simuladosDisponiveis = simuladosFiltrados.filter(
    (s) => !tentativas.some((t) => t.simulado_id === s.id && t.status === 'em_andamento'),
  )

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Simulados ENEM</h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            {banco} questões autorais disponíveis no banco · média de acerto {metricas.pctMedio}%
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={criando} className="rounded-xl font-bold">
                <Plus className="w-4 h-4 mr-1" /> Novo personalizado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Simulado personalizado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Área</Label>
                  <Select value={area} onValueChange={(v) => setArea(v as SimArea)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {AREA_LABEL[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={quantidade}
                      onChange={(e) =>
                        setQuantidade(Math.max(1, Math.min(90, Number(e.target.value))))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duração (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={600}
                      value={duracao}
                      onChange={(e) =>
                        setDuracao(Math.max(5, Math.min(600, Number(e.target.value))))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Dificuldade</Label>
                    <Select
                      value={dificuldade}
                      onValueChange={(v) => setDificuldade(v as typeof dificuldade)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ano</Label>
                    <Select value={ano} onValueChange={setAno}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os anos</SelectItem>
                        {anos.map((a) => (
                          <SelectItem key={a} value={String(a)}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={criarPersonalizado} disabled={criando}>
                  {criando ? 'Criando…' : 'Gerar simulado'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* em andamento */}
      {emAndamento && (
        <Card className="border-violet-300 bg-violet-50">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-violet-900">Simulado em andamento</p>
              <p className="text-xs text-violet-700">
                {emAndamento.expand?.simulado_id?.titulo} — retome de onde parou.
              </p>
            </div>
            <Button asChild className="rounded-xl font-bold bg-violet-600 hover:bg-violet-700">
              <Link to={`/simulados/enem/prova/${emAndamento.simulado_id}`}>Continuar</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: 'Simulados realizados', value: finalizadas.length },
          { icon: Target, label: 'Média de desempenho', value: `${metricas.pctMedio}%` },
          { icon: Trophy, label: 'Melhor resultado', value: `${melhorResultado}%` },
          { icon: Clock, label: 'Questões respondidas', value: metricas.totalQ },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-4">
              <k.icon className="w-4 h-4 text-violet-600 mb-2" />
              <p className="text-2xl font-black text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evolução */}
      {evolucao.length >= 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" /> Evolução ({evolucao.length}{' '}
              realizados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-28">
              {evolucao.map((e, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${e.pct}%`}
                >
                  <div
                    className="w-full max-w-[28px] rounded-t-md bg-violet-500"
                    style={{ height: `${Math.max(4, e.pct)}%` }}
                  />
                  <span className="text-[9px] text-slate-500 font-bold">{e.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRESETS.map((p) => (
          <Card key={p.tipo} className="hover:shadow-elevation transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl', p.bg)}
                >
                  <p.icone className={cn('h-5 w-5', p.cor)} />
                </span>
                <div>
                  <CardTitle className="text-sm">{p.titulo}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full rounded-xl font-bold"
                disabled={criando}
                onClick={() => iniciarPreset(p.tipo)}
              >
                <Play className="w-4 h-4 mr-1" /> Iniciar
                {banco < 90 && ' (verificar banco)'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* treino por área */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-600" /> Simulados de treino por área
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {AREA_PRESETS.map((ap) => (
            <button
              key={ap.area}
              disabled={criando}
              onClick={() => iniciarArea(ap.area)}
              className={cn(
                'p-4 rounded-2xl border bg-white hover:shadow-elevation transition-all text-left disabled:opacity-50',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2',
                  ap.bg,
                )}
              >
                <Target className={cn('h-4 w-4', ap.cor)} />
              </span>
              <p className="text-sm font-bold text-slate-900">{AREA_LABEL[ap.area]}</p>
              <p className="text-xs text-slate-500 font-medium">{ap.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* histórico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-violet-600" /> Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-slate-500">Carregando…</p>}
          {!loading && !finalizadas.length && (
            <p className="text-sm text-slate-500 font-medium">
              Nenhum simulado realizado ainda. Comece por um treino de 12 questões!
            </p>
          )}
          {finalizadas.map((t) => {
            const sim = t.expand?.simulado_id
            return (
              <Link
                key={t.id}
                to={`/simulados/enem/resultado/${t.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {sim?.titulo ?? 'Simulado'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(t.created).toLocaleDateString('pt-BR')} ·{' '}
                    {formatarTempo(t.tempo_usado_seg ?? 0)}
                  </p>
                </div>
                <span className="text-sm font-black text-violet-700 shrink-0">
                  {t.pct_acerto !== undefined && t.pct_acerto !== null ? `${t.pct_acerto}%` : '—'}
                </span>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      {/* lista de simulados disponíveis (criados) */}
      {simuladosDisponiveis.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-violet-600" /> Meus simulados criados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {simuladosDisponiveis.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-card-foreground truncate">{s.titulo}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {parseQuestoesIds(s).length} questões · {s.duracao_min} min ·{' '}
                    {new Date(s.created).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild size="sm" className="rounded-lg font-bold">
                    <Link to={`/simulados/enem/prova/${s.id}`}>Fazer</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-lg text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir simulado?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O simulado "{s.titulo}" e suas tentativas serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remover(s.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
