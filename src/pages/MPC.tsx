import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/EmptyState'
import { getMaterias, type MateriaRecord } from '@/services/materias'
import { getTopicos } from '@/services/topicos'
import {
  getMpcContents,
  createMpcContent,
  getContentProgress,
  upsertContentProgress,
  CONTENT_STATUS_LABELS,
  type MpcContentRecord,
  type ContentProgressRecord,
  type ContentStatus,
} from '@/services/premium'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Map as MapIcon,
  ListTree,
  FolderTree,
  BookOpen,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_ORDER: ContentStatus[] = [
  'nao_iniciado',
  'planejado',
  'em_andamento',
  'estudado',
  'em_revisao',
  'dominado',
]

const STATUS_VARIANT: Record<ContentStatus, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground border-transparent',
  planejado: 'bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-200',
  em_andamento:
    'bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-200',
  estudado: 'bg-sky-100 text-sky-800 border-transparent dark:bg-sky-950 dark:text-sky-200',
  em_revisao:
    'bg-violet-100 text-violet-800 border-transparent dark:bg-violet-950 dark:text-violet-200',
  dominado:
    'bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-200',
}

function pctDominio(p?: ContentProgressRecord) {
  if (!p) return 0
  const nivel = p.nivel_dominio || 0
  const bonus = p.status === 'dominado' ? 100 : p.status === 'estudado' ? 60 : 0
  return Math.max(nivel, bonus)
}

export default function MPC() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [materias, setMaterias] = useState<MateriaRecord[]>([])
  const [topicos, setTopicos] = useState<{ id: string; nome: string; materia_id: string }[]>([])
  const [conteudos, setConteudos] = useState<MpcContentRecord[]>([])
  const [progresso, setProgresso] = useState<Record<string, ContentProgressRecord>>({})
  const [selected, setSelected] = useState<{
    materia?: string
    topico?: string
    conteudo?: MpcContentRecord
  }>({})
  const [vista, setVista] = useState<'arvore' | 'lista' | 'cards'>('arvore')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [soAtrasadas, setSoAtrasadas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoSubassunto, setNovoSubassunto] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [criando, setCriando] = useState(false)

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [m, t, c, p] = await Promise.all([
        getMaterias(),
        getTopicos(),
        getMpcContents(),
        getContentProgress(user.id),
      ])
      setMaterias(m)
      setTopicos(t.map((x) => ({ id: x.id, nome: x.nome, materia_id: x.materia_id })))
      setConteudos(c)
      const map: Record<string, ContentProgressRecord> = {}
      for (const rec of p) map[rec.conteudo_id] = rec
      setProgresso(map)
    } catch (err) {
      toast({ title: 'Erro ao carregar MPC', description: String(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const hoje = new Date().toISOString().slice(0, 10)

  const topicosDaMateria = useMemo(
    () => topicos.filter((t) => !selected.materia || t.materia_id === selected.materia),
    [topicos, selected.materia],
  )

  const conteudosFiltrados = useMemo(() => {
    let list = conteudos
    if (selected.materia) list = list.filter((c) => c.materia_id === selected.materia)
    if (selected.topico) list = list.filter((c) => c.topico_id === selected.topico)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          (c.descricao || '').toLowerCase().includes(q) ||
          (c.subassunto || '').toLowerCase().includes(q),
      )
    }
    if (filtroStatus !== 'todos') {
      list = list.filter((c) => (progresso[c.id]?.status || 'nao_iniciado') === filtroStatus)
    }
    if (soAtrasadas) {
      list = list.filter((c) => {
        const p = progresso[c.id]
        return p?.proxima_revisao && p.proxima_revisao <= hoje && p.status !== 'dominado'
      })
    }
    return list
  }, [
    conteudos,
    progresso,
    selected.materia,
    selected.topico,
    busca,
    filtroStatus,
    soAtrasadas,
    hoje,
  ])

  const salvarProgresso = async (
    conteudoId: string,
    data: Partial<ContentProgressRecord>,
    msg?: string,
  ) => {
    if (!user?.id) return
    setSaving(true)
    try {
      const rec = await upsertContentProgress(user.id, conteudoId, data)
      setProgresso((prev) => ({ ...prev, [conteudoId]: rec }))
      if (msg) toast({ title: msg })
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const criarConteudo = async () => {
    if (!novoNome.trim() || !selected.topico || !selected.materia) {
      toast({
        title: 'Preencha os dados',
        description: 'Selecione matéria e assunto e digite o nome do conteúdo.',
        variant: 'destructive',
      })
      return
    }
    setCriando(true)
    try {
      const rec = await createMpcContent({
        topico_id: selected.topico,
        materia_id: selected.materia,
        nome: novoNome.trim(),
        subassunto: novoSubassunto.trim(),
        descricao: novaDescricao.trim(),
      })
      setConteudos((prev) => [rec, ...prev])
      setNovoNome('')
      setNovoSubassunto('')
      setNovaDescricao('')
      toast({ title: 'Conteúdo adicionado ao MPC' })
    } catch (err) {
      toast({ title: 'Erro ao criar conteúdo', description: String(err), variant: 'destructive' })
    } finally {
      setCriando(false)
    }
  }

  const atrasadosCount = conteudos.filter((c) => {
    const p = progresso[c.id]
    return p?.proxima_revisao && p.proxima_revisao <= hoje && p.status !== 'dominado'
  }).length

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px] lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MapIcon className="h-6 w-6 text-primary" /> MPC — Mapa de Progresso Competitivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Área do conhecimento → Matéria → Assunto → Conteúdo. Tudo salvo automaticamente.
          </p>
        </div>
        <Tabs value={vista} onValueChange={(v) => setVista(v as typeof vista)}>
          <TabsList>
            <TabsTrigger value="arvore" className="gap-1">
              <FolderTree className="h-3.5 w-3.5" /> Árvore
            </TabsTrigger>
            <TabsTrigger value="lista" className="gap-1">
              <ListTree className="h-3.5 w-3.5" /> Lista
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-1">
              <BookOpen className="h-3.5 w-3.5" /> Cards
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar conteúdo..."
            className="w-56 pl-8"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {CONTENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={soAtrasadas ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSoAtrasadas((v) => !v)}
          className="gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Atrasadas {atrasadosCount > 0 && `(${atrasadosCount})`}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Coluna 1: navegação hierárquica */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Navegação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {materias.length === 0 ? (
              <EmptyState
                icon={<BookOpen />}
                title="Nenhuma matéria cadastrada"
                description="As matérias do cronograma aparecerão aqui automaticamente."
              />
            ) : (
              materias.map((m) => {
                const aberta = selected.materia === m.id
                const tps = topicos.filter((t) => t.materia_id === m.id)
                return (
                  <div key={m.id}>
                    <button
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                        aberta && 'bg-muted',
                      )}
                      onClick={() =>
                        setSelected((s) => ({
                          materia: aberta ? undefined : m.id,
                          topico: undefined,
                          conteudo: undefined,
                        }))
                      }
                    >
                      {aberta ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="flex-1 truncate">{m.nome}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {tps.length} assuntos
                      </Badge>
                    </button>
                    {aberta && (
                      <div className="ml-4 border-l pl-2">
                        {tps.length === 0 && (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">Sem assuntos</p>
                        )}
                        {tps.map((t) => {
                          const tAberto = selected.topico === t.id
                          const qtd = conteudos.filter((c) => c.topico_id === t.id).length
                          return (
                            <div key={t.id}>
                              <button
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60',
                                  tAberto && 'bg-muted font-medium',
                                )}
                                onClick={() =>
                                  setSelected((s) => ({
                                    materia: m.id,
                                    topico: tAberto ? undefined : t.id,
                                    conteudo: undefined,
                                  }))
                                }
                              >
                                {tAberto ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                                <span className="flex-1 truncate">{t.nome}</span>
                                {qtd > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {qtd}
                                  </Badge>
                                )}
                              </button>
                              {tAberto &&
                                conteudos
                                  .filter((c) => c.topico_id === t.id)
                                  .map((c) => {
                                    const p = progresso[c.id]
                                    const st = (p?.status || 'nao_iniciado') as ContentStatus
                                    return (
                                      <button
                                        key={c.id}
                                        className={cn(
                                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 pl-5 text-left text-xs transition-colors hover:bg-muted/60',
                                          selected.conteudo?.id === c.id &&
                                            'bg-primary/10 font-medium',
                                        )}
                                        onClick={() => setSelected((s) => ({ ...s, conteudo: c }))}
                                      >
                                        <span className="flex-1 truncate">{c.nome}</span>
                                        <span
                                          className={cn(
                                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                            STATUS_VARIANT[st],
                                          )}
                                        >
                                          {CONTENT_STATUS_LABELS[st]}
                                        </span>
                                      </button>
                                    )
                                  })}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Coluna 2: conteúdo selecionado + criação */}
        <div className="space-y-4 lg:col-span-3">
          {selected.conteudo ? (
            <ConteudoDetalhe
              key={selected.conteudo.id}
              conteudo={selected.conteudo}
              progresso={progresso[selected.conteudo.id]}
              saving={saving}
              onSave={salvarProgresso}
            />
          ) : (
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={<FolderTree />}
                  title="Selecione um conteúdo"
                  description="Navegue pela árvore à esquerda para ver detalhes, marcar status, dominância e observações."
                />
              </CardContent>
            </Card>
          )}

          {/* Criar novo conteúdo no tópico selecionado */}
          {selected.topico && selected.materia && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4 text-primary" /> Novo conteúdo neste assunto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome do conteúdo (ex: Lei de Ohm)"
                />
                <Input
                  value={novoSubassunto}
                  onChange={(e) => setNovoSubassunto(e.target.value)}
                  placeholder="Subassunto (opcional)"
                />
                <Textarea
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder="Descrição (opcional)"
                  rows={2}
                />
                <Button onClick={criarConteudo} disabled={criando} className="gap-1.5">
                  {criando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Adicionar conteúdo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Vista lista / cards */}
      {vista !== 'arvore' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {vista === 'lista' ? 'Todos os conteúdos (lista)' : 'Conteúdos em cards'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conteudosFiltrados.length === 0 ? (
              <EmptyState
                icon={<BookOpen />}
                title="Nenhum conteúdo encontrado"
                description="Ajuste os filtros ou adicione conteúdos ao selecionar um assunto na árvore."
              />
            ) : vista === 'lista' ? (
              <ul className="divide-y divide-border/60">
                {conteudosFiltrados.map((c) => {
                  const p = progresso[c.id]
                  const st = (p?.status || 'nao_iniciado') as ContentStatus
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          setSelected({
                            materia: c.materia_id,
                            topico: c.topico_id,
                            conteudo: c,
                          })
                        }
                      >
                        <p className="truncate text-sm font-medium">{c.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {materias.find((m) => m.id === c.materia_id)?.nome || '—'}
                          {c.subassunto ? ` • ${c.subassunto}` : ''}
                        </p>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {pctDominio(p)}%
                        </span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                            STATUS_VARIANT[st],
                          )}
                        >
                          {CONTENT_STATUS_LABELS[st]}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {conteudosFiltrados.map((c) => {
                  const p = progresso[c.id]
                  const st = (p?.status || 'nao_iniciado') as ContentStatus
                  return (
                    <button
                      key={c.id}
                      className="rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() =>
                        setSelected({ materia: c.materia_id, topico: c.topico_id, conteudo: c })
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug">{c.nome}</p>
                        <span
                          className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                            STATUS_VARIANT[st],
                          )}
                        >
                          {CONTENT_STATUS_LABELS[st]}
                        </span>
                      </div>
                      {c.subassunto && (
                        <p className="mt-1 text-xs text-muted-foreground">{c.subassunto}</p>
                      )}
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pctDominio(p)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Domínio {pctDominio(p)}%
                        {p?.questoes_realizadas ? ` • ${p.questoes_realizadas} questões` : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------- detalhe do conteúdo ----------
function ConteudoDetalhe({
  conteudo,
  progresso,
  saving,
  onSave,
}: {
  conteudo: MpcContentRecord
  progresso?: ContentProgressRecord
  saving: boolean
  onSave: (conteudoId: string, data: Partial<ContentProgressRecord>, msg?: string) => Promise<void>
}) {
  const [status, setStatus] = useState<ContentStatus>(
    (progresso?.status || 'nao_iniciado') as ContentStatus,
  )
  const [dominio, setDominio] = useState<number[]>([progresso?.nivel_dominio || 0])
  const [obs, setObs] = useState(progresso?.observacoes || '')
  const [dificuldades, setDificuldades] = useState(progresso?.dificuldades || '')
  const [prioridade, setPrioridade] = useState(progresso?.prioridade || 0)

  const statusAtual = (progresso?.status || 'nao_iniciado') as ContentStatus

  const setStatusRapido = (s: ContentStatus) => {
    setStatus(s)
    onSave(
      conteudo.id,
      {
        status: s,
        ...(s === 'estudado' ? { ultima_data_estudo: new Date().toISOString().slice(0, 10) } : {}),
      },
      `Status: ${CONTENT_STATUS_LABELS[s]}`,
    )
  }

  const salvarTudo = () => {
    onSave(
      conteudo.id,
      { status, nivel_dominio: dominio[0], observacoes: obs, dificuldades, prioridade },
      'Progresso salvo',
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base leading-snug">{conteudo.nome}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {conteudo.expand?.materia_id?.nome || ''}
              {conteudo.subassunto ? ` • ${conteudo.subassunto}` : ''}
            </p>
          </div>
          <Badge className={cn('border', STATUS_VARIANT[statusAtual])}>
            {CONTENT_STATUS_LABELS[statusAtual]}
          </Badge>
        </div>
        {conteudo.descricao && (
          <p className="pt-1 text-sm text-muted-foreground">{conteudo.descricao}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />

        <div>
          <Label className="text-xs font-medium text-muted-foreground">Status</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusAtual === s ? 'default' : 'outline'}
                onClick={() => setStatusRapido(s)}
                disabled={saving}
              >
                {CONTENT_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Nível de domínio</Label>
            <span className="text-sm font-semibold tabular-nums">{dominio[0]}%</span>
          </div>
          <Slider
            className="mt-2"
            value={dominio}
            onValueChange={setDominio}
            onValueCommit={(v) => onSave(conteudo.id, { nivel_dominio: v[0] })}
            max={100}
            step={5}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Dificuldades registradas
            </Label>
            <Textarea
              className="mt-1.5"
              value={dificuldades}
              onChange={(e) => setDificuldades(e.target.value)}
              placeholder="O que trava nesse conteúdo?"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Observações pessoais
            </Label>
            <Textarea
              className="mt-1.5"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Anotações, macetes, links..."
              rows={3}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Prioridade</Label>
            <Select value={String(prioridade)} onValueChange={(v) => setPrioridade(Number(v))}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Normal</SelectItem>
                <SelectItem value="1">Alta</SelectItem>
                <SelectItem value="2">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground sm:pt-5">
            {progresso?.questoes_realizadas
              ? `${progresso.questoes_realizadas} questões realizadas`
              : 'Nenhuma questão vinculada ainda'}
            {progresso?.ultima_data_estudo
              ? ` • último estudo em ${new Date(progresso.ultima_data_estudo + 'T12:00:00').toLocaleDateString('pt-BR')}`
              : ''}
            {progresso?.proxima_revisao
              ? ` • próxima revisão ${new Date(progresso.proxima_revisao + 'T12:00:00').toLocaleDateString('pt-BR')}`
              : ''}
          </div>
        </div>

        <Button onClick={salvarTudo} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar progresso
        </Button>
      </CardContent>
    </Card>
  )
}
