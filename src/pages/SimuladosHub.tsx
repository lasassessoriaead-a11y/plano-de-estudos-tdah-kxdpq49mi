import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Search, BookOpen, History, Star } from 'lucide-react'
import {
  buscarNoBanco,
  listInstituicoes,
  listProvasAnteriores,
  listProvasIa,
  listTentativasIa,
  type InstituicaoRecord,
  type ProvaIaRecord,
  type TentativaIaRecord,
} from '@/services/central-simulados'

interface CategoriaDef {
  id: string
  nome: string
  descricao: string
  icone: string
  rota: string
}

const CATEGORIAS: CategoriaDef[] = [
  {
    id: 'enem',
    nome: 'ENEM',
    descricao: 'Provas e simulados do ENEM',
    icone: '🎓',
    rota: '/simulados/enem',
  },
  {
    id: 'vestibular',
    nome: 'Vestibulares',
    descricao: 'FUVEST, UNICAMP, UNESP…',
    icone: '📚',
    rota: '/simulados/vestibulares',
  },
  {
    id: 'faculdade_particular',
    nome: 'Faculdades particulares',
    descricao: 'PUC, Mackenzie, Insper…',
    icone: '🏛️',
    rota: '/simulados/vestibulares?tipo=particular',
  },
  {
    id: 'universidade_publica',
    nome: 'Universidades públicas',
    descricao: 'USP, UFRJ, UFMG…',
    icone: '🏫',
    rota: '/simulados/vestibulares?tipo=publica',
  },
  {
    id: 'concurso',
    nome: 'Concursos públicos',
    descricao: 'Cebraspe, FGV, FCC…',
    icone: '⚖️',
    rota: '/simulados/concursos',
  },
  {
    id: 'personalizados',
    nome: 'Simulados personalizados',
    descricao: 'Monte no seu foco',
    icone: '🎯',
    rota: '/simulados/criar',
  },
  {
    id: 'ia',
    nome: 'Simulados criados pela IA',
    descricao: 'Questões inéditas de IA',
    icone: '🤖',
    rota: '/simulados/criar?modo=ia',
  },
  {
    id: 'provas_anteriores',
    nome: 'Provas anteriores',
    descricao: 'Refaça provas reais',
    icone: '🗂️',
    rota: '/simulados/provas-anteriores',
  },
]

function ContagemCategoria({ categoria }: { categoria: CategoriaDef }) {
  const [instituicoes, setInstituicoes] = useState<InstituicaoRecord[] | null>(null)
  const [provas, setProvas] = useState<ProvaIaRecord[] | null>(null)

  useEffect(() => {
    let alive = true
    const carregar = async () => {
      try {
        if (
          ['vestibular', 'faculdade_particular', 'universidade_publica', 'concurso'].includes(
            categoria.id,
          )
        ) {
          const insts = await listInstituicoes()
          if (alive) {
            const filtradas =
              categoria.id === 'vestibular'
                ? insts.filter(
                    (i) =>
                      i.categoria === 'vestibular' ||
                      i.categoria === 'faculdade_particular' ||
                      i.categoria === 'universidade_publica',
                  )
                : insts.filter((i) => i.categoria === categoria.id)
            setInstituicoes(filtradas)
          }
        } else {
          const ps = await listProvasIa()
          if (alive) setProvas(ps)
        }
      } catch {
        if (alive) {
          setInstituicoes([])
          setProvas([])
        }
      }
    }
    carregar()
    return () => {
      alive = false
    }
  }, [categoria.id])

  const carregando = instituicoes === null && provas === null
  if (carregando) return <Skeleton className="h-4 w-20" />
  const n = instituicoes?.length ?? provas?.length ?? 0
  return (
    <span className="text-xs text-muted-foreground">
      {n} {n === 1 ? 'prova disponível' : 'provas disponíveis'}
    </span>
  )
}

function ResultadosBusca({ termo }: { termo: string }) {
  const [res, setRes] = useState<Awaited<ReturnType<typeof buscarNoBanco>> | null>(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    let alive = true
    if (!termo.trim()) {
      setRes(null)
      return
    }
    setCarregando(true)
    const t = setTimeout(() => {
      buscarNoBanco(termo)
        .then((r) => alive && setRes(r))
        .catch(() => alive && setRes(null))
        .finally(() => alive && setCarregando(false))
    }, 350)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [termo])

  if (!termo.trim()) return null
  const nada =
    res &&
    !res.instituicoes.length &&
    !res.provas.length &&
    !res.simulados.length &&
    !res.questoes.length

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4" /> Resultados para "{termo}"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando && <Skeleton className="h-16 w-full" />}
        {nada && !carregando && <p className="text-sm text-muted-foreground">Nada encontrado.</p>}
        {res?.instituicoes.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">Instituições</p>
            <div className="flex flex-wrap gap-2">
              {res.instituicoes.slice(0, 8).map((i) => (
                <Link key={i.id} to={`/simulados/instituicao/${i.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    {i.sigla ? `${i.sigla} — ${i.nome}` : i.nome}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {res?.provas.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">Provas anteriores</p>
            <ul className="space-y-1">
              {res.provas.slice(0, 6).map((p) => (
                <li key={p.id} className="text-sm text-muted-foreground">
                  {p.titulo} <Badge variant="secondary">{p.ano}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {res?.simulados.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">Meus simulados</p>
            <ul className="space-y-1">
              {res.simulados.slice(0, 6).map((p) => (
                <li key={p.id} className="text-sm text-muted-foreground">
                  {p.titulo}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {res?.questoes.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">Questões no banco</p>
            <p className="text-sm text-muted-foreground">
              {res.questoes.length} questão(ões) encontradas — veja no Banco de Questões.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function SimuladosHub() {
  const [termo, setTermo] = useState('')
  const [recomendacoes, setRecomendacoes] = useState<
    Awaited<ReturnType<typeof import('@/services/central-simulados').recomendar>>
  >([])
  const [tentativas, setTentativas] = useState<TentativaIaRecord[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    import('@/services/central-simulados')
      .then((m) => m.recomendar())
      .then((r) => alive && setRecomendacoes(r))
      .catch(() => {})
    listTentativasIa({ status: 'finalizada' })
      .then((t) => alive && setTentativas(t.slice(0, 5)))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const temHistorico = useMemo(() => tentativas.length > 0, [tentativas])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Central de Simulados</h1>
          <p className="text-sm text-muted-foreground">
            Escolha uma categoria, busque provas ou crie um simulado com IA.
          </p>
        </div>
        <Button onClick={() => navigate('/simulados/criar')}>
          <Sparkles className="mr-2 h-4 w-4" /> Criar prova com IA
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por instituição, banca, matéria ou ano…"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className="pl-9"
        />
      </div>

      <ResultadosBusca termo={termo} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIAS.map((c) => (
          <Link key={c.id} to={c.rota} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <span className="text-2xl">{c.icone}</span>
                <span className="font-medium leading-tight">{c.nome}</span>
                <span className="text-xs text-muted-foreground">{c.descricao}</span>
                <div className="mt-auto pt-2">
                  <ContagemCategoria categoria={c} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Recomendados para você
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {recomendacoes.map((r, idx) => (
              <div key={idx} className="rounded-lg border p-3">
                <p className="font-medium">{r.titulo}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.motivo}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => navigate('/simulados/criar', { state: r })}
                >
                  Fazer este
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {temHistorico && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Últimos simulados
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/simulados/historico">Ver histórico completo</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tentativas.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {t.expand?.prova_ia_id?.titulo ?? 'Simulado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.pct_acerto ?? 0}% de acerto{' '}
                    {t.favorita && (
                      <Star className="inline h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/simulados/resultado-ia/${t.id}`)}
                >
                  Ver resultado
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!temHistorico && (
        <p className="text-center text-sm text-muted-foreground">
          Faça seu primeiro simulado para ver histórico e recomendações.
        </p>
      )}
    </div>
  )
}
