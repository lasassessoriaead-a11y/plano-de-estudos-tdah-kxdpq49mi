import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Loader2, Search, BookOpenCheck } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { getMaterias, MateriaRecord } from '@/services/materias'
import { getTopicos, TopicoRecord } from '@/services/topicos'
import { getPerfilEstudo, PerfilEstudoRecord } from '@/services/perfil'
import { SubjectBadge } from '@/components/SubjectBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sincronizarComGoogleAgenda, TarefaAgenda } from '@/services/google-agenda'

export default function PlanoEstudos() {
  const [materias, setMaterias] = useState<MateriaRecord[]>([])
  const [topicos, setTopicos] = useState<TopicoRecord[]>([])
  const [selectedMateria, setSelectedMateria] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [perfil, setPerfil] = useState<PerfilEstudoRecord | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [m, t] = await Promise.all([getMaterias(), getTopicos()])
      setMaterias(m)
      setTopicos(t)
    }
    load()
  }, [])

  useEffect(() => {
    getPerfilEstudo(pb.authStore.record?.id || '')
      .then(setPerfil)
      .catch(() => {})
  }, [])

  const sincronizar = useCallback(async () => {
    setSincronizando(true)
    try {
      const tarefas: TarefaAgenda[] = topicos.slice(0, 10).map((t) => {
        const mat = materias.find((m) => m.id === t.materia_id)
        return { titulo: t.titulo, materia: mat?.nome }
      })
      const resultado = await sincronizarComGoogleAgenda({
        tarefas,
        dia: new Date().toISOString().slice(0, 10),
        horasPorDia: perfil?.horas_por_dia || 2,
        proximaProva: perfil?.data_prova ? { titulo: 'Prova', data: perfil.data_prova } : null,
      })
      if (resultado.criados === 0 && resultado.duplicados > 0) {
        toast.info('Tudo já está na sua agenda — nada novo para criar.')
      } else {
        toast.success(
          `${resultado.criados} evento(s) criado(s) na Google Agenda` +
            (resultado.duplicados > 0
              ? ` — ${resultado.duplicados} já existiam e foram pulados.`
              : '.'),
        )
      }
    } catch (err) {
      // "not_connected" é o caso esperado quando o usuário ainda não conectou.
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'not_connected') {
        toast.warning('Conecte sua Google Agenda para sincronizar.')
      } else {
        toast.error(`Falha ao sincronizar com a Google Agenda: ${msg}`)
      }
    } finally {
      setSincronizando(false)
    }
  }, [topicos, materias, perfil])

  const filtered = topicos.filter((t) => {
    const matchMat = selectedMateria === 'all' || t.materia_id === selectedMateria
    const matchSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchMat && matchSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Plano de Estudos</h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Mapeamento do edital por pesos das provas e nível de prioridade
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar tópico ou matéria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedMateria('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0 ${selectedMateria === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
          >
            Todas as Matérias
          </button>
          {materias.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMateria(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0 ${selectedMateria === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
            >
              {m.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <CalendarClock className="h-4 w-4 text-primary shrink-0" />
          <span>
            Leve as tarefas de hoje e revisões para a sua{' '}
            <Link to="/configuracoes" className="font-bold text-primary hover:underline">
              Google Agenda (conecte em Configurações)
            </Link>
            .
          </span>
        </div>
        <Button
          onClick={sincronizar}
          disabled={sincronizando}
          className="font-bold rounded-xl gap-1.5 shrink-0"
        >
          {sincronizando && <Loader2 className="h-4 w-4 animate-spin" />}
          Sincronizar com Google Agenda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const mat = t.expand?.materia_id
          return (
            <div
              key={t.id}
              className="bg-card p-5 rounded-2xl border border-border shadow-subtle hover:shadow-elevation transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {mat && (
                    <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} peso={mat.peso} />
                  )}
                  <PriorityBadge prioridade={t.prioridade} />
                </div>
                <h3 className="text-base font-extrabold text-foreground">{t.titulo}</h3>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                  {t.descricao || 'Tópico direcionado para o vestibular.'}
                </p>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-semibold capitalize">
                  Metodologia: {t.tipo || 'fluxograma'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  Disponível
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card p-8 rounded-2xl border border-border text-center">
          <BookOpenCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Nenhum tópico encontrado com esses filtros.
          </p>
        </div>
      )}
    </div>
  )
}
