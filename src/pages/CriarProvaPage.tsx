import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Check, Loader2, Sparkles } from 'lucide-react'
import CriarProvaDialog from '@/components/simulados/CriarProvaDialog'
import {
  listBancas,
  listInstituicoes,
  MODO_LABEL,
  type InstituicaoRecord,
  type ModoProva,
  type Recomendacao,
} from '@/services/central-simulados'
import { cn } from '@/lib/utils'

const MATERIAS_SUGERIDAS = [
  'Biologia',
  'Química',
  'Física',
  'Matemática',
  'Português',
  'Literatura',
  'História',
  'Geografia',
  'Inglês',
  'Redação',
]

const DIFICULDADES = ['facil', 'medio', 'dificil'] as const

export default function CriarProvaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const estado = (location.state ?? {}) as Partial<Recomendacao>

  const [modo, setModo] = useState<ModoProva>(
    estado.modo === 'prova_anterior' ||
      estado.modo === 'base_provas_reais' ||
      estado.modo === 'inedito_ia' ||
      estado.modo === 'misto'
      ? estado.modo
      : 'inedito_ia',
  )
  const [instituicoes, setInstituicoes] = useState<InstituicaoRecord[]>([])
  const [bancas, setBancas] = useState<{ id: string; nome: string }[]>([])
  const [instituicao, setInstituicao] = useState(estado.instituicao ?? '')
  const [banca, setBanca] = useState(estado.banca ?? '')
  const [materias, setMaterias] = useState<string[]>(estado.materias ?? [])
  const [qtd, setQtd] = useState(estado.qtd ?? 10)
  const [dificuldade, setDificuldade] = useState<string>(estado.dificuldade ?? 'medio')
  const [qtdIa, setQtdIa] = useState(Math.min(qtd, 5))
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const gerouRef = useRef(false)

  useEffect(() => {
    listInstituicoes()
      .then(setInstituicoes)
      .catch(() => setInstituicoes([]))
    listBancas()
      .then((bs) => setBancas(bs.map((b) => ({ id: b.id, nome: b.nome }))))
      .catch(() => setBancas([]))
  }, [])

  const toggleMateria = (m: string) => {
    setMaterias((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const alternativasSelecionadas = useMemo(
    () => ({ modo, instituicao, banca, materias, qtd, dificuldade }),
    [modo, instituicao, banca, materias, qtd, dificuldade],
  )

  const gerar = useCallback(async () => {
    setErro('')
    setGerando(true)
    try {
      const { gerarProvaIa } = await import('@/services/central-simulados')
      const res = await gerarProvaIa({
        modo,
        config: {
          instituicao: instituicao || undefined,
          banca: banca || undefined,
          materias: materias.length ? materias : undefined,
          qtd_questoes: qtd,
          dificuldade: dificuldade as 'facil' | 'medio' | 'dificil' | 'todas',
          qtd_ia: modo === 'misto' ? Math.min(qtdIa, qtd) : undefined,
        },
      })
      navigate(`/simulados/prova-ia/${res.prova_id}`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar a prova')
    } finally {
      setGerando(false)
    }
  }, [modo, instituicao, banca, materias, qtd, dificuldade, qtdIa, navigate])

  // "Montar automaticamente para mim": usa o estado como veio da recomendação
  const montarAutomatico = () => {
    if (!gerouRef.current) {
      gerouRef.current = true
      gerar()
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" /> Criar prova com IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha o modo, a instituição/banca e as matérias. A IA monta o simulado para você.
        </p>
      </div>

      {estado.titulo && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{estado.titulo}</p>
              <p className="text-xs text-muted-foreground">{estado.motivo}</p>
            </div>
            <Button onClick={montarAutomatico} disabled={gerando}>
              {gerando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Montar automaticamente para mim
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Modo da prova</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {(['prova_anterior', 'base_provas_reais', 'inedito_ia', 'misto'] as ModoProva[]).map(
            (m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  modo === m ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                )}
              >
                <span className="flex items-center justify-between font-medium">
                  {MODO_LABEL[m]}
                  {modo === m && <Check className="h-4 w-4 text-primary" />}
                </span>
              </button>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Instituição e banca</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Instituição</Label>
            <Select value={instituicao} onValueChange={setInstituicao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Nenhuma específica</SelectItem>
                {instituicoes.map((i) => (
                  <SelectItem key={i.id} value={i.sigla || i.nome}>
                    {i.sigla ? `${i.sigla} — ${i.nome}` : i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Banca</Label>
            <Select value={banca} onValueChange={setBanca}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Nenhuma específica</SelectItem>
                {bancas.map((b) => (
                  <SelectItem key={b.id} value={b.nome}>
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Matérias</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {MATERIAS_SUGERIDAS.map((m) => (
            <Badge
              key={m}
              variant={materias.includes(m) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleMateria(m)}
            >
              {m}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Quantidade, dificuldade e mistura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Quantidade de questões: {qtd}</Label>
            <Slider min={5} max={60} step={5} value={[qtd]} onValueChange={([v]) => setQtd(v)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Dificuldade</Label>
            <Select value={dificuldade} onValueChange={setDificuldade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {DIFICULDADES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modo === 'misto' && (
            <div className="grid gap-1.5">
              <Label>
                Quantas das {qtd} questões são inéditas de IA: {qtdIa}
              </Label>
              <Slider
                min={0}
                max={qtd}
                step={1}
                value={[qtdIa]}
                onValueChange={([v]) => setQtdIa(v)}
              />
              <p className="text-xs text-muted-foreground">
                {qtd - qtdIa} de provas reais + {qtdIa} inéditas de IA.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/simulados')}>
          Cancelar
        </Button>
        <Button onClick={gerar} disabled={gerando}>
          {gerando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {gerando ? 'Gerando…' : 'Gerar prova'}
        </Button>
      </div>

      {/* diálogo reutilizado quando o usuário chega sem recomendação */}
      <CriarProvaDialog
        open={false}
        onOpenChange={() => {}}
        onProvaCriada={(id) => navigate(`/simulados/prova-ia/${id}`)}
        inicial={{
          modo,
          instituicao,
          banca,
          materias,
          qtd,
          dificuldade: dificuldade as 'facil' | 'medio' | 'dificil' | 'todas',
        }}
      />
    </div>
  )
}
