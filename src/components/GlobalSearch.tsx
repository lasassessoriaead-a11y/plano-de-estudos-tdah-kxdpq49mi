import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, FolderTree, X } from 'lucide-react'

export interface GlobalSearchData {
  materias: { id: string; nome: string }[]
  topicos: { id: string; nome: string; materia_id: string }[]
}

interface Props extends GlobalSearchData {}

interface Hit {
  key: string
  label: string
  sub: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

export default function GlobalSearch({ materias, topicos }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: Hit[] = []

    for (const m of materias) {
      if (m.nome.toLowerCase().includes(q))
        out.push({ key: `m-${m.id}`, label: m.nome, sub: 'Matéria', to: '/plano', icon: BookOpen })
    }
    for (const t of topicos) {
      if (t.nome.toLowerCase().includes(q))
        out.push({ key: `t-${t.id}`, label: t.nome, sub: 'Tópico', to: '/plano', icon: FolderTree })
    }
    return out.slice(0, 8)
  }, [query, materias, topicos])

  return (
    <div ref={boxRef} className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar matérias, tópicos..."
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-11 left-0 right-0 rounded-xl border border-border bg-popover text-popover-foreground shadow-elevation z-50 overflow-hidden">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((h) => {
                const Icon = h.icon
                return (
                  <li key={h.key}>
                    <button
                      onClick={() => {
                        setOpen(false)
                        setQuery('')
                        navigate(h.to)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold truncate">{h.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{h.sub}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
