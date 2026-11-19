import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Bot,
  BookOpen,
  Star,
  Trash2,
  Pencil,
  Copy,
  Plus,
  ArrowLeft,
  Sparkles,
  Upload,
  RefreshCw,
  ListChecks,
  Layers,
  Brain,
  ZoomIn,
} from 'lucide-react'
import MindMapCanvas from '@/components/MindMapCanvas'
import {
  type MindMapRecord,
  type MindMapNodeRecord,
  listMindMaps,
  getFullMindMap,
  createMindMap,
  updateMindMap,
  deleteMindMap,
  duplicateMindMap,
  chamarIA,
  importarDocumento,
  type RespostaIA,
  type NoIA,
  updateNode,
} from '@/services/mindmaps'

interface Flashcard {
  frente: string
  verso: string
}

interface Questao {
  enunciado: string
  alternativas: string[]
  gabarito: number
  explicacao?: string
}

const NIVEIS_DETALHE = [
  { valor: 'resumido', label: 'Resumido' },
  { valor: 'intermediario', label: 'Intermediário' },
  { valor: 'aprofundado', label: 'Aprofundado' },
]
const NIVEIS_CONHEC = [
  { valor: 'basico', label: 'Básico' },
  { valor: 'intermediario', label: 'Intermediário' },
  { valor: 'avancado', label: 'Avançado' },
]
const FOCOS = [
  { valor: 'enem', label: 'Foco ENEM' },
  { valor: 'vestibular', label: 'Foco Vestibular' },
]

type Modo = 'biblioteca' | 'gerar' | 'editor'

export default function MapasMentais() {
  const { toast } = useToast()

  const [modo, setModo] = useState<Modo>('biblioteca')
  const [carregando, setCarregando] = useState(true)
  const [mapas, setMapas] = useState<MindMapRecord[]>([])
  const [topicoSel, setTopicoSel] = useState<string | null>(null)

  // ------- geração -------
  const [assunto, setAssunto] = useState('')
  const [nivelDetalhe, setNivelDetalhe] = useState('intermediario')
  const [nivelConhec, setNivelConhec] = useState('intermediario')
  const [foco, setFoco] = useState('enem')
  const [textoDoc, setTextoDoc] = useState('')
  const [gerando, setGerando] = useState(false)

  // ------- editor -------
  const [mapaAtual, setMapaAtual] = useState<MindMapRecord | null>(null)
  const [nos, setNos] = useState<MindMapNodeRecord[]>([])
  const [painelIA, setPainelIA] = useState<string>('')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [iaOcupada, setIaOcupada] = useState(false)
  const [renomeando, setRenomeando] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const carregarBiblioteca = useCallback(async () => {
    setCarregando(true)
    try {
      setMapas(await listMindMaps())
    } catch (_) {
      toast({
        title: 'Erro',
        description: 'Não consegui carregar seus mapas.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }, [toast])

  useEffect(() => {
    carregarBiblioteca()
  }, [carregarBiblioteca])

  // ---------- GERAÇÃO AUTOMÁTICA ----------
  const gerarMapa = async () => {
    if (!assunto.trim()) {
      toast({ title: 'Atenção', description: 'Digite o assunto do mapa mental.' })
      return
    }
    setGerando(true)
    try {
      const resp = await chamarIA({
        acao: 'gerar',
        tema: assunto.trim(),
        nivel_detalhe: nivelDetalhe,
        nivel_conhecimento: nivelConhec,
        foco,
        texto_documento: textoDoc.trim() || undefined,
      })
      if (!resp.nos || resp.nos.length === 0) throw new Error('mapa vazio')

      const novo = await createMindMap({
        titulo: resp.titulo || assunto.trim(),
        assunto: resp.assunto || assunto.trim(),
        materia: '',
        nivel_detalhe: nivelDetalhe,
        nivel_conhecimento: nivelConhec,
        foco,
      })
      await criarNosNoBanco(novo.id, resp.nos)
      setAssunto('')
      setTextoDoc('')
      await carregarBiblioteca()
      setMapaAtual(novo)
      const { nos: nosNovos } = await getFullMindMap(novo.id)
      setNos(nosNovos)
      setModo('editor')
      toast({ title: 'Mapa criado!', description: 'Salvo na sua biblioteca.' })
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao gerar o mapa',
        variant: 'destructive',
      })
    } finally {
      setGerando(false)
    }
  }

  const criarNosNoBanco = async (mapaId: string, lista: NoIA[]) => {
    const { default: pb } = await import('@/lib/pocketbase/client')
    const requests = lista
      .filter((n) => n.chave && n.rotulo)
      .slice(0, 80)
      .map((n) => ({
        method: 'POST',
        url: '/api/collections/mind_map_nodes/records',
        body: {
          mapa_id: mapaId,
          chave: String(n.chave),
          rotulo: String(n.rotulo),
          detalhe: String(n.detalhe || ''),
          nivel: Number(n.nivel) || 0,
          pai: String(n.pai || ''),
          cor: String(n.cor || (n.nivel === 0 ? 'violeta' : 'azul')),
        },
      }))
    if (requests.length === 0) return
    await pb.send('/api/collections/mind_map_nodes/records/batch', {
      method: 'POST',
      body: { requests } as unknown as Record<string, unknown>,
    })
  }

  // ---------- IMPORTAÇÃO ----------
  const enviarArquivo = async (file: File) => {
    try {
      const r = await importarDocumento(file, '')
      setTextoDoc(r.texto)
      toast({
        title: r.truncado ? 'Documento lido parcialmente' : 'Documento lido!',
        description: r.truncado
          ? 'Usei os primeiros ~30 mil caracteres. Muito conteúdo pode ter ficado de fora.'
          : 'Conteúdo extraído e pronto para virar mapa mental.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Não consegui ler o arquivo',
        variant: 'destructive',
      })
    }
  }

  // ---------- AÇÕES DA BIBLIOTECA ----------
  const toggleFavorito = async (m: MindMapRecord) => {
    setMapas((prev) => prev.map((x) => (x.id === m.id ? { ...x, favorito: !m.favorito } : x)))
    try {
      await updateMindMap(m.id, { favorito: !m.favorito })
    } catch (_) {
      setMapas((prev) => prev.map((x) => (x.id === m.id ? { ...x, favorito: m.favorito } : x)))
    }
  }

  const excluirMapa = async (m: MindMapRecord) => {
    if (!window.confirm(`Excluir o mapa "${m.titulo}"? Essa ação não tem volta.`)) return
    try {
      await deleteMindMap(m.id)
      setMapas((prev) => prev.filter((x) => x.id !== m.id))
      toast({ title: 'Mapa excluído' })
    } catch (_) {
      toast({ title: 'Erro', description: 'Não consegui excluir', variant: 'destructive' })
    }
  }

  const duplicarMapa = async (m: MindMapRecord) => {
    try {
      const novo = await duplicateMindMap(m)
      if (novo) {
        await carregarBiblioteca()
        toast({ title: 'Mapa duplicado!' })
      }
    } catch (_) {
      toast({ title: 'Erro', description: 'Não consegui duplicar', variant: 'destructive' })
    }
  }

  const renomearMapa = async () => {
    if (!mapaAtual || !novoTitulo.trim()) return
    try {
      const atualizado = await updateMindMap(mapaAtual.id, { titulo: novoTitulo.trim() })
      setMapaAtual(atualizado)
      setRenomeando(false)
      toast({ title: 'Título atualizado' })
    } catch (_) {
      toast({ title: 'Erro', description: 'Não consegui renomear', variant: 'destructive' })
    }
  }

  const abrirEditor = async (m: MindMapRecord) => {
    try {
      setCarregando(true)
      const full = await getFullMindMap(m.id)
      setMapaAtual(m)
      setNos(full.nos)
      setPainelIA('')
      setFlashcards([])
      setQuestoes([])
      setModo('editor')
    } catch (_) {
      toast({ title: 'Erro', description: 'Não consegui abrir o mapa', variant: 'destructive' })
    } finally {
      setCarregando(false)
    }
  }

  // ---------- BOTÕES DE IA ----------
  const executarIA = async (
    acao: 'expandir' | 'resumir' | 'explicar' | 'exemplos' | 'questoes' | 'flashcards',
  ) => {
    if (!mapaAtual) return
    const topico = topicoSel
    if (!topico && acao !== 'questoes' && acao !== 'flashcards') {
      toast({
        title: 'Atenção',
        description: 'Clique num tópico do mapa primeiro para selecioná-lo.',
      })
      return
    }
    setIaOcupada(true)
    try {
      const contexto = nos
        .map(
          (n) =>
            `[${n.chave}] (nível ${n.nivel}${n.pai ? `, filho de ${n.pai}` : ' raiz'}) ${n.rotulo}: ${n.detalhe}`,
        )
        .join('\n')
      const resp = await chamarIA({
        acao,
        topico: topico || undefined,
        tema: mapaAtual.assunto,
        contexto,
        foco: mapaAtual.foco,
      })
      aplicarRespostaIA(acao, resp)
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha na IA',
        variant: 'destructive',
      })
    } finally {
      setIaOcupada(false)
    }
  }

  const aplicarRespostaIA = async (acao: string, resp: RespostaIA) => {
    if (acao === 'questoes') {
      setQuestoes(resp.questoes || [])
      setPainelIA('questoes')
      return
    }
    if (acao === 'flashcards') {
      setFlashcards(resp.flashcards || [])
      setPainelIA('flashcards')
      return
    }
    if (acao === 'explicar') {
      setPainelIA('explicacao')
      if (resp.explicacao) {
        toast({ title: 'Explicação pronta', description: resp.explicacao.slice(0, 140) })
      }
      return
    }
    if (acao === 'resumir' && resp.nos && resp.nos.length === 1 && topicoSel) {
      // caso simples: IA reescreveu o próprio nó — achar por chave
      const alvo = nos.find((n) => n.chave === topicoSel)
      if (alvo) {
        // só sobrescreve se vier rótulo novo
        if (resp.nos[0].rotulo) {
          const novaLista = nos.map((n) =>
            n.id === alvo.id
              ? { ...n, rotulo: resp.nos![0].rotulo, detalhe: resp.nos![0].detalhe || alvo.detalhe }
              : n,
          )
          setNos(novaLista)
          updateNode(alvo.id, {
            rotulo: resp.nos[0].rotulo,
            detalhe: resp.nos[0].detalhe || alvo.detalhe,
          }).catch(() => {})
        }
      }
      return
    }
    if (resp.nos && resp.nos.length > 0) {
      await criarNosNoBanco(mapaAtual!.id, resp.nos)
      const full = await getFullMindMap(mapaAtual!.id)
      setNos(full.nos)
      toast({
        title: 'Mapa atualizado!',
        description: `${resp.nos.length} novo(s) nó(s) adicionado(s).`,
      })
    }
  }

  const gerarOutroMapa = () => {
    setMapaAtual(null)
    setNos([])
    setFlashcards([])
    setQuestoes([])
    setPainelIA('')
    setModo('gerar')
  }

  // ---------- exportação PDF/imagem (simples) ----------
  const exportarTexto = () => {
    if (!mapaAtual) return
    const linhas = nos
      .map((n) => `${'  '.repeat(n.nivel)}- ${n.rotulo}${n.detalhe ? ` — ${n.detalhe}` : ''}`)
      .join('\n')
    const conteudo = `${mapaAtual.titulo}\n\n${linhas}`
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mapaAtual.titulo.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- RENDER ----------
  if (modo === 'biblioteca') {
    const favoritos = mapas.filter((m) => m.favorito)
    const outros = mapas.filter((m) => !m.favorito)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-600" /> Mapas Mentais com IA
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sua biblioteca privada — organize, edite e estude com a Coruja Mentora.
            </p>
          </div>
          <Button
            onClick={() => setModo('gerar')}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-1.5" /> Novo mapa com IA
          </Button>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" /> Qual assunto você deseja transformar em
            mapa mental?
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              'Revolução Francesa',
              'Eletrostática',
              'Funções quadráticas',
              'Genética',
              'Ecologia',
              'Segunda Guerra Mundial',
              'Nietzsche',
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setAssunto(ex)
                  setModo('gerar')
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {carregando ? (
          <div className="h-40 flex items-center justify-center text-sm text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando seus mapas...
          </div>
        ) : mapas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <Brain className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhum mapa ainda</p>
            <p className="text-sm text-slate-400 mt-1">
              Crie seu primeiro mapa mental com a IA e ele aparece aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {favoritos.length > 0 && (
              <Secao
                titulo="Favoritos"
                itens={favoritos}
                acoes={{ toggleFavorito, excluirMapa, duplicarMapa, abrirEditor }}
              />
            )}
            <Secao
              titulo="Todos os mapas"
              itens={outros}
              acoes={{ toggleFavorito, excluirMapa, duplicarMapa, abrirEditor }}
            />
          </div>
        )}
      </div>
    )
  }

  if (modo === 'gerar') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setModo('biblioteca')}
          className="text-slate-500 hover:text-violet-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar para biblioteca
        </Button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-subtle">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-violet-600" /> Gerar mapa mental com IA
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              A Coruja Mentora pesquisa e organiza o conteúdo de forma didática e hierárquica.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Qual assunto você deseja transformar em mapa mental?
            </label>
            <Input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Revolução Francesa, Eletrostática, Genética..."
              className="rounded-xl border-slate-200 focus:border-violet-500"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Seletor
              label="Detalhamento"
              valores={NIVEIS_DETALHE}
              atual={nivelDetalhe}
              onChange={setNivelDetalhe}
            />
            <Seletor
              label="Seu nível"
              valores={NIVEIS_CONHEC}
              atual={nivelConhec}
              onChange={setNivelConhec}
            />
            <Seletor label="Foco" valores={FOCOS} atual={foco} onChange={setFoco} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Material de apoio (opcional)
              </label>
              <button
                className="text-xs font-semibold text-violet-600 hover:underline"
                onClick={() => fileRef.current?.click()}
              >
                Enviar PDF, DOCX ou TXT
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.csv,.html"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0]
                  if (f) enviarArquivo(f)
                  e.target.value = ''
                }}
              />
            </div>
            <Textarea
              value={textoDoc}
              onChange={(e) => setTextoDoc(e.target.value)}
              placeholder="Cole aqui suas anotações ou envie um arquivo acima — a IA usa esse conteúdo como base do mapa."
              className="min-h-[110px] rounded-xl border-slate-200 focus:border-violet-500 text-sm"
            />
          </div>

          <Button
            onClick={gerarMapa}
            disabled={gerando || !assunto.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
          >
            {gerando ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Gerando mapa...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Gerar mapa mental
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ---------- EDITOR ----------
  const noAtual = nos.find((n) => n.chave === topicoSel)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => setModo('biblioteca')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {renomeando ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                className="h-8 w-56"
                onKeyDown={(e) => e.key === 'Enter' && renomearMapa()}
              />
              <Button size="sm" onClick={renomearMapa} className="bg-violet-600 text-white">
                Salvar
              </Button>
            </div>
          ) : (
            <button
              className="text-lg font-extrabold text-slate-900 truncate hover:text-violet-600"
              onClick={() => {
                setNovoTitulo(mapaAtual?.titulo || '')
                setRenomeando(true)
              }}
              title="Clique para renomear"
            >
              {mapaAtual?.titulo || 'Mapa'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportarTexto} className="font-semibold">
            <BookOpen className="w-4 h-4 mr-1.5" /> Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mapaAtual && duplicarMapa(mapaAtual)}
            className="font-semibold"
          >
            <Copy className="w-4 h-4 mr-1.5" /> Duplicar
          </Button>
          <Button
            size="sm"
            onClick={gerarOutroMapa}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            <Sparkles className="w-4 h-4 mr-1.5" /> Gerar outro mapa
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* canvas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-subtle">
          {nos.length === 0 ? (
            <div className="h-[420px] flex flex-col items-center justify-center text-slate-400">
              <Layers className="w-8 h-8 mb-2" />
              <p className="text-sm">Este mapa está vazio.</p>
            </div>
          ) : (
            <MindMapCanvas
              nos={nos}
              mapaId={mapaAtual!.id}
              onNosChange={setNos}
              selecionado={topicoSel}
              onSelecionar={setTopicoSel}
            />
          )}
        </div>

        {/* painel lateral IA */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-subtle">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {noAtual ? 'Tópico selecionado' : 'Ações de IA'}
            </p>
            {noAtual && (
              <p className="text-sm font-bold text-violet-700 truncate">{noAtual.rotulo}</p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <AcaoIA
                icon={Plus}
                label="Expandir tópico"
                onClick={() => executarIA('expandir')}
                disabled={iaOcupada}
              />
              <AcaoIA
                icon={BookOpen}
                label="Resumir tópico"
                onClick={() => executarIA('resumir')}
                disabled={iaOcupada}
              />
              <AcaoIA
                icon={Brain}
                label="Explicar conceito"
                onClick={() => executarIA('explicar')}
                disabled={iaOcupada}
              />
              <AcaoIA
                icon={ZoomIn}
                label="Adicionar exemplos"
                onClick={() => executarIA('exemplos')}
                disabled={iaOcupada}
              />
              <AcaoIA
                icon={ListChecks}
                label="Criar questões"
                onClick={() => executarIA('questoes')}
                disabled={iaOcupada}
              />
              <AcaoIA
                icon={Layers}
                label="Transformar em flashcards"
                onClick={() => executarIA('flashcards')}
                disabled={iaOcupada}
              />
            </div>
            {iaOcupada && (
              <p className="text-[11px] text-violet-500 flex items-center gap-1 pt-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> A Coruja está pensando...
              </p>
            )}
          </div>

          {/* resultado da IA */}
          {painelIA === 'questoes' && questoes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 max-h-[420px] overflow-y-auto shadow-subtle">
              <p className="text-xs font-bold text-slate-500 uppercase">Questões geradas</p>
              {questoes.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-800">
                    {i + 1}. {q.enunciado}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {q.alternativas.map((a, j) => (
                      <li
                        key={j}
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded',
                          j === q.gabarito
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'text-slate-600',
                        )}
                      >
                        {String.fromCharCode(65 + j)}) {a}
                      </li>
                    ))}
                  </ul>
                  {q.explicacao && (
                    <p className="text-[10px] text-slate-500 mt-1.5 italic">💡 {q.explicacao}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {painelIA === 'flashcards' && flashcards.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 max-h-[420px] overflow-y-auto shadow-subtle">
              <p className="text-xs font-bold text-slate-500 uppercase">Flashcards gerados</p>
              {flashcards.map((f, i) => (
                <div key={i} className="p-3 rounded-xl bg-violet-50 border border-violet-200">
                  <p className="text-xs font-bold text-violet-900">{f.frente}</p>
                  <p className="text-[11px] text-violet-700 mt-1">{f.verso}</p>
                </div>
              ))}
            </div>
          )}

          {painelIA === 'explicacao' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                Explicação da Coruja
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                A explicação aparece na notificação acima (toast) porque é um texto corrido.
              </p>
            </div>
          )}

          {painelIA === '' && !iaOcupada && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Clique em um tópico do mapa e use as ações de IA. Salvo automaticamente a cada
                alteração — pode fechar e voltar quando quiser.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- subcomponentes ----------

function AcaoIA({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors disabled:opacity-50"
    >
      <Icon className="w-4 h-4 text-violet-600" />
      <span className="text-[10px] font-bold text-slate-600 leading-tight text-center">
        {label}
      </span>
    </button>
  )
}

function Seletor({
  label,
  valores,
  atual,
  onChange,
}: {
  label: string
  valores: { valor: string; label: string }[]
  atual: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1">
        {valores.map((v) => (
          <button
            key={v.valor}
            onClick={() => onChange(v.valor)}
            className={cn(
              'px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors',
              atual === v.valor
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Secao({
  titulo,
  itens,
  acoes,
}: {
  titulo: string
  itens: MindMapRecord[]
  acoes: {
    toggleFavorito: (m: MindMapRecord) => void
    excluirMapa: (m: MindMapRecord) => void
    duplicarMapa: (m: MindMapRecord) => void
    abrirEditor: (m: MindMapRecord) => void
  }
}) {
  if (itens.length === 0) return null
  return (
    <section>
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">{titulo}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {itens.map((m) => (
          <div
            key={m.id}
            className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-violet-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => acoes.abrirEditor(m)} className="text-left min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-700">
                  {m.titulo}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {m.assunto}
                  {m.materia ? ` • ${m.materia}` : ''}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(m.created).toLocaleDateString('pt-BR')} • {m.nivel_detalhe} •{' '}
                  {m.foco.toUpperCase()}
                </p>
              </button>
              <button
                onClick={() => acoes.toggleFavorito(m)}
                title={m.favorito ? 'Remover dos favoritos' : 'Favoritar'}
                className="shrink-0 p-1 rounded hover:bg-amber-50"
              >
                <Star
                  className={cn(
                    'w-4 h-4',
                    m.favorito ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                  )}
                />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => acoes.abrirEditor(m)}
                className="flex-1 text-[11px] font-bold text-violet-600 hover:bg-violet-50 py-1 rounded"
              >
                Abrir
              </button>
              <button
                onClick={() => acoes.duplicarMapa(m)}
                title="Duplicar"
                className="p-1.5 rounded hover:bg-slate-100"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => acoes.excluirMapa(m)}
                title="Excluir"
                className="p-1.5 rounded hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
