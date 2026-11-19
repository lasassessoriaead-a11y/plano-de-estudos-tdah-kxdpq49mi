import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Database } from 'lucide-react'
import { listQuestoesExpandidas, type QuestaoExpandidaRecord } from '@/services/central-simulados'

const ORIGENS = [
  { value: 'todas', label: 'Todas' },
  { value: 'oficial_autorizada', label: 'Oficial autorizada' },
  { value: 'gerada_ia', label: 'Gerada por IA' },
]

export default function BancoQuestoes() {
  const navigate = useNavigate()
  const [questoes, setQuestoes] = useState<QuestaoExpandidaRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [materia, setMateria] = useState('todas')
  const [dificuldade, setDificuldade] = useState('todas')
  const [origem, setOrigem] = useState('todas')
  const [ano, setAno] = useState('')
  const [pagina, setPagina] = useState(1)
  const porPagina = 10

  useEffect(() => {
    listQuestoesExpandidas()
      .then(setQuestoes)
      .catch(() => setQuestoes([]))
      .finally(() => setCarregando(false))
  }, [])

  const materias = useMemo(
    () => Array.from(new Set(questoes.map((q) => q.materia).filter(Boolean))).sort(),
    [questoes],
  )
  const anos = useMemo(
    () =>
      Array.from(new Set(questoes.map((q) => String(q.ano ?? '')).filter(Boolean)))
        .sort()
        .reverse(),
    [questoes],
  )

  const filtradas = useMemo(() => {
    let lista = questoes
    if (busca.trim()) {
      const t = busca.trim().toLowerCase()
      lista = lista.filter(
        (q) =>
          (q.enunciado ?? '').toLowerCase().includes(t) ||
          (q.assunto ?? '').toLowerCase().includes(t) ||
          (q.instituicao ?? '').toLowerCase().includes(t) ||
          (q.banca ?? '').toLowerCase().includes(t),
      )
    }
    if (materia !== 'todas') lista = lista.filter((q) => q.materia === materia)
    if (dificuldade !== 'todas') lista = lista.filter((q) => q.dificuldade === dificuldade)
    if (origem !== 'todas') lista = lista.filter((q) => q.origem === origem)
    if (ano) lista = lista.filter((q) => String(q.ano ?? '') === ano)
    return lista
  }, [questoes, busca, materia, dificuldade, origem, ano])

  const paginadas = useMemo(
    () => filtradas.slice((pagina - 1) * porPagina, pagina * porPagina),
    [filtradas, pagina],
  )

  const mostrarAlternativa = useCallback((q: QuestaoExpandidaRecord) => {
    try {
      const alts =
        typeof q.alternativas_json === 'string'
          ? (JSON.parse(q.alternativas_json) as string[])
          : (q.alternativas_json as string[] | undefined)
      return Array.isArray(alts) ? alts : []
    } catch {
      return []
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Database className="h-6 w-6" /> Banco inteligente de questões
        </h1>
        <p className="text-sm text-muted-foreground">
          {questoes.length} questões — enunciado, alternativas, gabarito e resolução comentada.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar no enunciado, assunto, instituição ou banca…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={materia}
          onValueChange={(v) => {
            setMateria(v)
            setPagina(1)
          }}
        >
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="Matéria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as matérias</SelectItem>
            {materias.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={dificuldade}
          onValueChange={(v) => {
            setDificuldade(v)
            setPagina(1)
          }}
        >
          <SelectTrigger className="md:w-36">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Toda dificuldade</SelectItem>
            <SelectItem value="facil">Fácil</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="dificil">Difícil</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={origem}
          onValueChange={(v) => {
            setOrigem(v)
            setPagina(1)
          }}
        >
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            {ORIGENS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {anos.length > 0 && (
          <Select
            value={ano || 'todos'}
            onValueChange={(v) => {
              setAno(v === 'todos' ? '' : v)
              setPagina(1)
            }}
          >
            <SelectTrigger className="md:w-28">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os anos</SelectItem>
              {anos.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {carregando ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : paginadas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma questão encontrada com esses filtros.
        </p>
      ) : (
        <div className="space-y-3">
          {paginadas.map((q) => {
            const alts = mostrarAlternativa(q)
            return (
              <Card key={q.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.materia && (
                      <Badge variant="secondary">
                        {q.materia}
                        {q.assunto ? ` — ${q.assunto}` : ''}
                      </Badge>
                    )}
                    {q.instituicao && <Badge variant="outline">{q.instituicao}</Badge>}
                    {q.banca && <Badge variant="outline">{q.banca}</Badge>}
                    {q.ano ? <Badge variant="outline">{q.ano}</Badge> : null}
                    {q.dificuldade && <Badge variant="outline">{q.dificuldade}</Badge>}
                    {q.tipo_questao === 'certo_errado' && (
                      <Badge variant="outline">Certo/Errado</Badge>
                    )}
                    {q.tipo_questao === 'discursiva' && <Badge variant="outline">Discursiva</Badge>}
                    {q.origem === 'gerada_ia' ? (
                      <Badge variant="default">Gerada por IA</Badge>
                    ) : (
                      <Badge variant="secondary">Oficial autorizada</Badge>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{q.enunciado}</p>
                  {alts.length > 0 && (
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {alts.map((a, i) => (
                        <li key={i}>
                          {String.fromCharCode(65 + i)}) {a}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.gabarito !== undefined && q.gabarito !== '' && (
                    <p className="text-sm">
                      <span className="font-medium text-green-600">Gabarito:</span>{' '}
                      {q.tipo_questao === 'certo_errado'
                        ? Number(q.gabarito) === 0
                          ? 'Certo'
                          : 'Errado'
                        : q.tipo_questao === 'discursiva'
                          ? String(q.gabarito)
                          : String.fromCharCode(65 + Number(q.gabarito))}
                    </p>
                  )}
                  {q.resolucao_comentada && (
                    <p className="rounded-md bg-muted p-2 text-sm">
                      <span className="font-medium">Resolução:</span> {q.resolucao_comentada}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filtradas.length > porPagina && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagina} de {Math.ceil(filtradas.length / porPagina)} ({filtradas.length}{' '}
            questões)
          </span>
          <Button
            variant="outline"
            disabled={pagina >= Math.ceil(filtradas.length / porPagina)}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/simulados')}>
          Voltar para a Central
        </Button>
      </div>
    </div>
  )
}
