import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  type MindMapNodeRecord,
  updateNode,
  createNode,
  deleteNode,
  type NoIA,
} from '@/services/mindmaps'
import { Plus, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react'

interface Props {
  nos: MindMapNodeRecord[]
  mapaId: string
  onNosChange: (nos: MindMapNodeRecord[]) => void
  selecionado: string | null
  onSelecionar: (chave: string | null) => void
}

const CORES: Record<string, string> = {
  violeta: 'bg-violet-100 border-violet-400 text-violet-900',
  azul: 'bg-blue-100 border-blue-400 text-blue-900',
  esmeralda: 'bg-emerald-100 border-emerald-400 text-emerald-900',
  âmbar: 'bg-amber-100 border-amber-400 text-amber-900',
  rosa: 'bg-pink-100 border-pink-400 text-pink-900',
  ciano: 'bg-cyan-100 border-cyan-400 text-cyan-900',
  laranja: 'bg-orange-100 border-orange-400 text-orange-900',
  vermelho: 'bg-red-100 border-red-400 text-red-900',
}

const CORES_LISTA = Object.keys(CORES)

const NIVEL_W = [220, 240, 260, 260]
const NIVEL_H = [90, 74, 64, 64]

export default function MindMapCanvas({
  nos,
  mapaId,
  onNosChange,
  selecionado,
  onSelecionar,
}: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.85)
  const [colapsados, setColapsados] = useState<Set<string>>(new Set())
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const raiz = nos.find((n) => n.nivel === 0)

  const filhosDe = useCallback((pai: string) => nos.filter((n) => n.pai === pai), [nos])

  // ---- Autosave posição ----
  const salvarPosicao = useCallback((node: MindMapNodeRecord, x: number, y: number) => {
    updateNode(node.id, { pos_x: Math.round(x), pos_y: Math.round(y) }).catch(() => {
      // silencioso: não bloqueia o usuário
    })
  }, [])

  const handleMouseDown = (e: React.MouseEvent, node: MindMapNodeRecord) => {
    e.stopPropagation()
    onSelecionar(node.chave)
    if (editando === node.id) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    dragOffset.current = {
      x: (e.clientX - rect.left) / zoom - node.pos_x,
      y: (e.clientY - rect.top) / zoom - node.pos_y,
    }
    setArrastando(node.id)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arrastando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom - dragOffset.current.x
    const y = (e.clientY - rect.top) / zoom - dragOffset.current.y
    onNosChange(nos.map((n) => (n.id === arrastando ? { ...n, pos_x: x, pos_y: y } : n)))
  }

  const handleMouseUp = () => {
    if (!arrastando) return
    const node = nos.find((n) => n.id === arrastando)
    setArrastando(null)
    if (node) salvarPosicao(node, node.pos_x, node.pos_y)
  }

  // ---- Edição de texto ----
  const salvarTexto = (node: MindMapNodeRecord, novoRotulo: string, novoDetalhe: string) => {
    updateNode(node.id, { rotulo: novoRotulo, detalhe: novoDetalhe })
      .then(() => {
        onNosChange(
          nos.map((n) =>
            n.id === node.id ? { ...n, rotulo: novoRotulo, detalhe: novoDetalhe } : n,
          ),
        )
      })
      .catch(() => {})
  }

  // ---- Cores ----
  const trocarCor = (node: MindMapNodeRecord, cor: string) => {
    updateNode(node.id, { cor })
      .then(() => {
        onNosChange(nos.map((n) => (n.id === node.id ? { ...n, cor } : n)))
      })
      .catch(() => {})
  }

  // ---- Adicionar ramificação ----
  const adicionarFilho = async (pai: MindMapNodeRecord) => {
    const irmaos = filhosDe(pai.chave)
    const novaChave = `${pai.chave}-x${irmaos.length + 1}-${Date.now() % 1000}`
    const x = pai.pos_x + NIVEL_W[Math.min(pai.nivel + 1, 3)]
    const y = pai.pos_y + (irmaos.length - (pai.nivel === 0 ? 0 : 1)) * 100
    try {
      const criado = await createNode({
        mapa_id: mapaId,
        chave: novaChave,
        rotulo: 'Novo tópico',
        detalhe: '',
        nivel: pai.nivel + 1,
        pai: pai.chave,
        cor: CORES_LISTA[irmaos.length % CORES_LISTA.length],
        pos_x: x,
        pos_y: y,
      })
      onNosChange([...nos, criado])
      onSelecionar(criado.chave)
      setEditando(criado.id)
    } catch (_) {
      // silencioso
    }
  }

  // ---- Excluir tópico ----
  const excluirNo = async (node: MindMapNodeRecord) => {
    if (node.nivel === 0) return
    try {
      await deleteNode(node.id)
      onNosChange(nos.filter((n) => n.id !== node.id && n.pai !== node.chave))
      if (selecionado === node.chave) onSelecionar(null)
    } catch {
      /* intentionally ignored */
    }
  }

  const toggleColapsar = (node: MindMapNodeRecord) => {
    setColapsados((prev) => {
      const novo = new Set(prev)
      if (novo.has(node.chave)) novo.delete(node.chave)
      else novo.add(node.chave)
      return novo
    })
  }

  const renderNo = (node: MindMapNodeRecord) => {
    const filhos = filhosDe(node.chave)
    const temFilhos = filhos.length > 0
    const colapsado = colapsados.has(node.chave)
    const w = NIVEL_W[Math.min(node.nivel, 3)]
    const h = NIVEL_H[Math.min(node.nivel, 3)]
    const isSel = selecionado === node.id
    const cor = CORES[node.cor] || (node.nivel === 0 ? CORES.violeta : CORES.azul)

    return (
      <div key={node.id}>
        <div
          className="absolute select-none"
          style={{ left: node.pos_x, top: node.pos_y, width: w, zIndex: isSel ? 30 : 10 }}
          onMouseDown={(e) => handleMouseDown(e, node)}
        >
          <div
            className={cn(
              'rounded-xl border-2 px-3 py-2 shadow-sm cursor-grab active:cursor-grabbing transition-shadow',
              cor,
              isSel && 'ring-2 ring-violet-500 ring-offset-2 shadow-md',
            )}
          >
            {editando === node.id ? (
              <div className="space-y-1">
                <input
                  autoFocus
                  defaultValue={node.rotulo}
                  className="w-full bg-white/80 border border-violet-300 rounded px-2 py-0.5 text-xs font-bold outline-none"
                  onBlur={(e) => {
                    salvarTexto(node, e.target.value.trim() || node.rotulo, node.detalhe)
                    setEditando(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      salvarTexto(node, e.currentTarget.value.trim() || node.rotulo, node.detalhe)
                      setEditando(null)
                    }
                  }}
                />
                <input
                  defaultValue={node.detalhe}
                  placeholder="detalhe"
                  className="w-full bg-white/80 border border-slate-200 rounded px-2 py-0.5 text-[10px] outline-none"
                  onBlur={(e) => {
                    salvarTexto(node, node.rotulo, e.target.value)
                    setEditando(null)
                  }}
                />
              </div>
            ) : (
              <div onDoubleClick={() => setEditando(node.id)}>
                <p className="text-xs font-bold leading-tight">{node.rotulo}</p>
                {node.detalhe && (
                  <p className="text-[10px] opacity-80 leading-snug mt-0.5 line-clamp-2">
                    {node.detalhe}
                  </p>
                )}
              </div>
            )}

            {/* toolbar flutuante */}
            {isSel && editando !== node.id && (
              <div className="absolute -top-8 left-0 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1 py-0.5 shadow-md">
                {temFilhos && (
                  <button
                    title="Expandir/recolher"
                    className="p-1 hover:bg-slate-100 rounded"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleColapsar(node)
                    }}
                  >
                    {colapsado ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                )}
                <button
                  title="Adicionar ramificação"
                  className="p-1 hover:bg-slate-100 rounded"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    adicionarFilho(node)
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-violet-600" />
                </button>
                <button
                  title="Editar texto"
                  className="p-1 hover:bg-slate-100 rounded"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditando(node.id)
                  }}
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                </button>
                {node.nivel > 0 && (
                  <button
                    title="Excluir tópico"
                    className="p-1 hover:bg-red-50 rounded"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      excluirNo(node)
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}
              </div>
            )}

            {/* seletor de cores */}
            {isSel && editando !== node.id && node.nivel > 0 && (
              <div className="absolute -bottom-9 left-0 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1 shadow-md">
                {CORES_LISTA.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      trocarCor(node, c)
                    }}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border',
                      CORES[c],
                      node.cor === c && 'ring-2 ring-offset-1 ring-slate-400',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* linhas para filhos */}
        {temFilhos && !colapsado && (
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            {filhos.map((f) => {
              const x1 = node.pos_x + w
              const y1 = node.pos_y + h / 2
              const x2 = f.pos_x
              const y2 = f.pos_y + NIVEL_H[Math.min(f.nivel, 3)] / 2
              const mx = (x1 + x2) / 2
              return (
                <path
                  key={f.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  fill="none"
                />
              )
            })}
          </svg>
        )}

        {/* filhos */}
        {temFilhos && !colapsado && filhos.map((f) => renderNo(f))}
      </div>
    )
  }

  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  if (!montado || !raiz) {
    return (
      <div className="h-[420px] flex items-center justify-center text-sm text-slate-400">
        Sem tópicos para exibir ainda.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* controles de zoom */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1 bg-card/95 border border-border rounded-xl px-2 py-1 shadow-sm">
        <button
          className="px-2 text-sm font-bold text-muted-foreground hover:text-primary"
          onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}
        >
          −
        </button>
        <span className="text-[11px] font-semibold text-muted-foreground w-9 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="px-2 text-sm font-bold text-muted-foreground hover:text-primary"
          onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
        >
          +
        </button>
        <button
          className="px-2 text-[10px] font-semibold text-muted-foreground hover:text-primary"
          onClick={() => setZoom(0.85)}
        >
          reset
        </button>
      </div>

      <div
        ref={canvasRef}
        className="relative overflow-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-violet-50/40"
        style={{ height: 520 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={() => onSelecionar(null)}
      >
        <div
          style={{
            width: 2600,
            height: 1600,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {renderNo(raiz)}
        </div>
      </div>
    </div>
  )
}

export type { NoIA }
