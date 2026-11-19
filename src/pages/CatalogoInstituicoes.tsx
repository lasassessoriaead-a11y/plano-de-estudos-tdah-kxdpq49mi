import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  listBancas,
  listInstituicoes,
  type BancaRecord,
  type InstituicaoRecord,
} from '@/services/central-simulados'
import { Search } from 'lucide-react'

const BANCAS_CONCURSOS = [
  'Cebraspe',
  'FGV',
  'FCC',
  'Vunesp',
  'AOCP',
  'IBFC',
  'Consulplan',
  'Quadrix',
  'Idecan',
  'Fundatec',
]

const CATEGORIAS_CONCURSO = [
  'Administrativos',
  'Policiais',
  'Bancários',
  'Fiscais',
  'Jurídicos',
  'Tribunais',
  'Saúde',
  'Educação',
  'Municipais',
  'Estaduais',
  'Federais',
]

export default function CatalogoVestibulares() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const tipoFiltro = searchParams.get('tipo') // 'particular' | 'publica' | null
  const isConcursos = location.pathname.includes('/concursos')

  const [instituicoes, setInstituicoes] = useState<InstituicaoRecord[]>([])
  const [bancas, setBancas] = useState<BancaRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [bancaFiltro, setBancaFiltro] = useState('todas')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [escolaridadeFiltro, setEscolaridadeFiltro] = useState('todas')

  useEffect(() => {
    Promise.all([listInstituicoes(), listBancas()])
      .then(([insts, bs]) => {
        setInstituicoes(insts)
        setBancas(bs)
      })
      .catch(() => {
        setInstituicoes([])
        setBancas([])
      })
      .finally(() => setCarregando(false))
  }, [])

  const listaFiltrada = useMemo(() => {
    let lista = instituicoes
    if (isConcursos) {
      lista = lista.filter((i) => i.categoria === 'concurso')
    } else {
      lista = lista.filter((i) => i.categoria !== 'concurso')
      if (tipoFiltro === 'particular') lista = lista.filter((i) => i.tipo === 'particular')
      if (tipoFiltro === 'publica') lista = lista.filter((i) => i.tipo === 'publica')
    }
    if (busca.trim()) {
      const t = busca.trim().toLowerCase()
      lista = lista.filter(
        (i) =>
          i.nome.toLowerCase().includes(t) ||
          (i.sigla ?? '').toLowerCase().includes(t) ||
          (i.bancas ?? '').toLowerCase().includes(t) ||
          (i.cursos ?? '').toLowerCase().includes(t),
      )
    }
    if (bancaFiltro !== 'todas') lista = lista.filter((i) => (i.bancas ?? '').includes(bancaFiltro))
    return lista
  }, [instituicoes, isConcursos, tipoFiltro, busca, bancaFiltro])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isConcursos ? 'Concursos públicos' : 'Catálogo de vestibulares'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isConcursos
            ? 'Bancas, categorias e órgãos — filtre pelo cargo ou edital de interesse.'
            : 'Instituições, formato de prova e provas anteriores.'}
        </p>
      </div>

      {isConcursos && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_CONCURSO.map((c) => (
            <Badge
              key={c}
              variant={categoriaFiltro === c ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoriaFiltro(categoriaFiltro === c ? 'todas' : c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar instituição…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={bancaFiltro} onValueChange={setBancaFiltro}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="Banca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as bancas</SelectItem>
            {(isConcursos
              ? BANCAS_CONCURSOS.map((b) => ({ id: b, nome: b }))
              : bancas.filter((b) => !BANCAS_CONCURSOS.includes(b.nome))
            ).map((b) => (
              <SelectItem key={b.id} value={b.nome}>
                {b.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isConcursos && (
          <Select value={escolaridadeFiltro} onValueChange={setEscolaridadeFiltro}>
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Escolaridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="fundamental">Fundamental</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="superior">Superior</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {carregando ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : listaFiltrada.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listaFiltrada.map((i) => (
            <Card
              key={i.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => navigate(`/simulados/instituicao/${i.id}`)}
            >
              <CardContent className="p-4">
                <p className="font-medium">{i.sigla ? `${i.sigla} — ${i.nome}` : i.nome}</p>
                {i.bancas && (
                  <p className="mt-1 text-xs text-muted-foreground">Bancas: {i.bancas}</p>
                )}
                {i.cursos && <p className="text-xs text-muted-foreground">Cursos: {i.cursos}</p>}
                <Badge variant="secondary" className="mt-2">
                  {i.categoria === 'concurso'
                    ? 'Concurso'
                    : i.tipo === 'particular'
                      ? 'Particular'
                      : 'Pública'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma instituição encontrada com esses filtros.
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/simulados')}>
          Voltar para a Central
        </Button>
      </div>
    </div>
  )
}
