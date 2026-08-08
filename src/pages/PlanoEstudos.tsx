import { useState, useEffect } from 'react'
import { getMaterias, MateriaRecord } from '@/services/materias'
import { getTopicos, TopicoRecord } from '@/services/topicos'
import { SubjectBadge } from '@/components/SubjectBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Input } from '@/components/ui/input'
import { Search, BookOpenCheck } from 'lucide-react'

export default function PlanoEstudos() {
  const [materias, setMaterias] = useState<MateriaRecord[]>([])
  const [topicos, setTopicos] = useState<TopicoRecord[]>([])
  const [selectedMateria, setSelectedMateria] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const load = async () => {
      const [m, t] = await Promise.all([getMaterias(), getTopicos()])
      setMaterias(m)
      setTopicos(t)
    }
    load()
  }, [])

  const filtered = topicos.filter((t) => {
    const matchMat = selectedMateria === 'all' || t.materia_id === selectedMateria
    const matchSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchMat && matchSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Plano de Estudos</h1>
        <p className="text-sm text-slate-600 font-medium mt-1">
          Mapeamento do edital por pesos de Medicina e nível de prioridade
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar tópico ou matéria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm rounded-xl border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedMateria('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0 ${selectedMateria === 'all' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
          >
            Todas as Matérias
          </button>
          {materias.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMateria(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0 ${selectedMateria === m.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            >
              {m.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const mat = t.expand?.materia_id
          return (
            <div
              key={t.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-elevation transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {mat && (
                    <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} peso={mat.peso} />
                  )}
                  <PriorityBadge prioridade={t.prioridade} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t.titulo}</h3>
                <p className="text-sm text-slate-600 font-medium line-clamp-2">
                  {t.descricao || 'Tópico direcionado para o vestibular.'}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                <span className="font-semibold capitalize">
                  Metodologia: {t.tipo || 'fluxograma'}
                </span>
                <span className="text-emerald-600 font-extrabold">Disponível</span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <BookOpenCheck className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">
            Nenhum tópico encontrado com esses filtros.
          </p>
        </div>
      )}
    </div>
  )
}
