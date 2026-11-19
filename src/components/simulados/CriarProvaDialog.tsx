import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  gerarProvaIa,
  getTentativaIaEmAndamento,
  listTentativasIa,
  MODO_LABEL,
  type ModoProva,
  type Recomendacao,
} from '@/services/central-simulados'
import { cn } from '@/lib/utils'

const DIFICULDADES = ['facil', 'medio', 'dificil'] as const
type Dificuldade = (typeof DIFICULDADES)[number]

interface CriarProvaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProvaCriada: (provaId: string) => void
  inicial?: Partial<{
    modo: ModoProva
    instituicao: string
    banca: string
    materias: string[]
    qtd: number
    dificuldade: Dificuldade | 'todas'
  }>
}

const ModoCard = ({
  modo,
  selecionado,
  onSelect,
}: {
  modo: ModoProva
  selecionado: boolean
  onSelect: () => void
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'rounded-lg border p-3 text-left transition-colors',
      selecionado ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
    )}
  >
    <div className="flex items-center justify-between">
      <span className="font-medium">{MODO_LABEL[modo]}</span>
      {modo === 'inedito_ia' && <Badge variant="secondary">IA</Badge>}
      {modo === 'misto' && <Badge variant="outline">IA + reais</Badge>}
    </div>
    <p className="mt-1 text-xs text-muted-foreground">{MODO_DESC[modo]}</p>
  </button>
)

export default function CriarProvaDialog({
  open,
  onOpenChange,
  onProvaCriada,
  inicial,
}: CriarProvaDialogProps) {
  const [modo, setModo] = useState<ModoProva>(inicial?.modo ?? 'inedito_ia')
  const [instituicao, setInstituicao] = useState(inicial?.instituicao ?? '')
  const [banca, setBanca] = useState(inicial?.banca ?? '')
  const [materiasTexto, setMateriasTexto] = useState((inicial?.materias ?? []).join(', '))
  const [qtd, setQtd] = useState(inicial?.qtd ?? 10)
  const [dificuldade, setDificuldade] = useState<Dificuldade | 'todas'>(
    inicial?.dificuldade ?? 'medio',
  )
  const [qtdIa, setQtdIa] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async () => {
    setErro('')
    setGerando(true)
    try {
      const materias = materiasTexto
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
      const res = await gerarProvaIa({
        modo,
        config: {
          titulo: titulo || undefined,
          instituicao: instituicao || undefined,
          banca: banca || undefined,
          materias: materias.length ? materias : undefined,
          qtd_questoes: qtd,
          dificuldade,
          qtd_ia: modo === 'misto' ? Math.min(qtdIa, qtd) : undefined,
        },
      })
      toast.success('Prova gerada com sucesso!')
      onOpenChange(false)
      onProvaCriada(res.prova_id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar a prova')
    } finally {
      setGerando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar prova com IA</DialogTitle>
          <DialogDescription>
            A IA monta uma prova no estilo da instituição/banca escolhida. Modos "inédito por IA" e
            "misto" geram questões originais (nunca oficiais).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Modo</Label>
            <div className="grid gap-2">
              {(['prova_anterior', 'base_provas_reais', 'inedito_ia', 'misto'] as ModoProva[]).map(
                (m) => (
                  <ModoCard key={m} modo={m} selecionado={modo === m} onSelect={() => setModo(m)} />
                ),
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cp-inst">Instituição</Label>
              <Input
                id="cp-inst"
                placeholder="Ex.: FUVEST, Cebraspe"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cp-banca">Banca</Label>
              <Input
                id="cp-banca"
                placeholder="Ex.: VUNESP"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cp-materias">Matérias (separadas por vírgula)</Label>
            <Textarea
              id="cp-materias"
              placeholder="Ex.: Biologia, Química, Física"
              value={materiasTexto}
              onChange={(e) => setMateriasTexto(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Quantidade de questões: {qtd}</Label>
            <Slider min={5} max={60} step={5} value={[qtd]} onValueChange={([v]) => setQtd(v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Dificuldade</Label>
              <Select
                value={dificuldade}
                onValueChange={(v) => setDificuldade(v as Dificuldade | 'todas')}
              >
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
                <Label>Qtd. de questões de IA: {qtdIa}</Label>
                <Slider
                  min={0}
                  max={qtd}
                  step={1}
                  value={[qtdIa]}
                  onValueChange={([v]) => setQtdIa(v)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cp-titulo">Título (opcional)</Label>
            <Input
              id="cp-titulo"
              placeholder="Ex.: Treino FUVEST 1ª fase"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <Button onClick={handleSubmit} disabled={gerando} className="mt-1">
            {gerando ? 'Gerando prova…' : 'Gerar prova com IA'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
