import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Flag, Timer } from 'lucide-react'
import {
  criarTentativaIa,
  getProvaIa,
  getTentativaIaEmAndamento,
  parseQuestoesProva,
  salvarTentativaIa,
  type ProvaIaRecord,
  type QuestaoProva,
  type TentativaIaRecord,
} from '@/services/central-simulados'
import { cn } from '@/lib/utils'

export default function ProvaIaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [prova, setProva] = useState<ProvaIaRecord | null>(null)
  const [tentativa, setTentativa] = useState<TentativaIaRecord | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [confirmarFim, setConfirmarFim] = useState(false)
  const [tempoRestante, setTempoRestante] = useState<number | null>(null)
  const salvoRef = useRef<string>('')

  const questoes = useMemo(() => (prova ? parseQuestoesProva(prova) : []), [prova])
  const questaoAtual = questoes[indice]

  // carrega prova + retomada de tentativa em andamento
  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([getProvaIa(id), getTentativaIaEmAndamento(id)])
      .then(([p, t]) => {
        if (!alive) return
        setProva(p)
        if (t) {
          setTentativa(t)
          try {
            const raw =
              typeof t.respostas_json === 'string'
                ? t.respostas_json
                : JSON.stringify(t.respostas_json ?? {})
            setRespostas(JSON.parse(raw) as Record<string, string>)
          } catch {
            /* respostas corrompidas — começa limpo */
          }
          try {
            const raw =
              typeof t.marcadas_json === 'string'
                ? t.marcadas_json
                : JSON.stringify(t.marcadas_json ?? [])
            const arr = JSON.parse(raw) as string[]
            if (Array.isArray(arr)) setMarcadas(arr)
          } catch {
            /* ignora */
          }
          if (t.tempo_usado_seg && p.duracao_min) {
            setTempoRestante(Math.max(0, p.duracao_min * 60 - t.tempo_usado_seg))
          }
        } else {
          setTempoRestante(p.duracao_min ? p.duracao_min * 60 : null)
        }
      })
      .catch(() => alive && toast.error('Não foi possível carregar a prova'))
      .finally(() => alive && setCarregando(false))
    return () => {
      alive = false
    }
  }, [id])

  // cria tentativa na primeira resposta (não antes)
  const garantirTentativa = async (): Promise<TentativaIaRecord | null> => {
    if (tentativa) return tentativa
    if (!id) return null
    try {
      const t = await criarTentativaIa(id)
      setTentativa(t)
      return t
    } catch {
      toast.error('Não foi possível iniciar a tentativa')
      return null
    }
  }

  // autosave (debounce simples por mudança de conteúdo)
  useEffect(() => {
    if (!tentativa || !Object.keys(respostas).length) return
    const assinatura = JSON.stringify({ respostas, marcadas })
    if (assinatura === salvoRef.current) return
    const t = setTimeout(() => {
      salvoRef.current = assinatura
      salvarTentativaIa(tentativa.id, {
        respostas,
        marcadas,
        tempoUsadoSeg: prova?.duracao_min
          ? prova.duracao_min * 60 - (tempoRestante ?? 0)
          : undefined,
      }).catch(() => {})
    }, 800)
    return () => clearTimeout(t)
  }, [respostas, marcadas, tentativa, prova, tempoRestante])

  // cronômetro
  useEffect(() => {
    if (tempoRestante === null || confirmarFim) return
    const t = setInterval(
      () => setTempoRestante((prev) => (prev === null ? null : Math.max(0, prev - 1))),
      1000,
    )
    return () => clearInterval(t)
  }, [tempoRestante, confirmarFim])

  useEffect(() => {
    if (tempoRestante === 0 && !confirmarFim) {
      toast('Tempo esgotado!')
      finalizar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestante === 0])

  const responder = async (valor: string) => {
    if (!questaoAtual) return
    setRespostas((prev) => ({ ...prev, [questaoAtual.id]: valor }))
    await garantirTentativa()
  }

  const toggleMarcar = () => {
    if (!questaoAtual) return
    setMarcadas((prev) =>
      prev.includes(questaoAtual.id)
        ? prev.filter((x) => x !== questaoAtual.id)
        : [...prev, questaoAtual.id],
    )
  }

  const finalizar = async () => {
    if (!tentativa || !prova) {
      setConfirmarFim(false)
      return
    }
    const { corrigirProva } = await import('@/services/central-simulados')
    const resultado = corrigirProva(
      questoes,
      respostas,
      prova.duracao_min ? prova.duracao_min * 60 - (tempoRestante ?? 0) : 0,
    )
    try {
      await salvarTentativaIa(tentativa.id, {
        status: 'finalizada',
        finalizadoEm: new Date().toISOString(),
        pctAcerto: resultado.pctAcerto,
        resultadoJson: {
          total: resultado.total,
          acertos: resultado.acertos,
          erros: resultado.erros,
          brancos: resultado.brancos,
          pctAcerto: resultado.pctAcerto,
          porMateria: resultado.porMateria,
          porTipo: resultado.porTipo,
          porOrigem: resultado.porOrigem,
        },
        tempoUsadoSeg: resultado.tempoSeg,
      })
      toast.success('Prova finalizada!')
      navigate(`/simulados/resultado-ia/${tentativa.id}`)
    } catch {
      toast.error('Erro ao finalizar a prova')
      setConfirmarFim(false)
    }
  }

  const formatarTempo = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!prova || !questaoAtual) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p>Prova não encontrada ou sem questões.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/simulados/criar')}>
          Voltar
        </Button>
      </div>
    )
  }

  const respondidas = questoes.filter(
    (q) => respostas[q.id] !== undefined && respostas[q.id] !== '',
  ).length

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">{prova.titulo}</h1>
          <p className="text-xs text-muted-foreground">
            {prova.instituicao}
            {prova.banca ? ` — ${prova.banca}` : ''} · {questoes.length} questões
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tempoRestante !== null && (
            <Badge variant={tempoRestante < 300 ? 'destructive' : 'secondary'} className="gap-1">
              <Timer className="h-3 w-3" /> {formatarTempo(tempoRestante)}
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => setConfirmarFim(true)}>
            Finalizar
          </Button>
        </div>
      </div>

      <Progress value={(respondidas / questoes.length) * 100} />

      <div className="flex flex-wrap gap-1.5">
        {questoes.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndice(i)}
            className={cn(
              'h-7 w-7 rounded text-xs font-medium',
              i === indice
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
              marcadas.includes(q.id) && 'ring-2 ring-yellow-400',
              respostas[q.id] &&
                i !== indice &&
                'bg-green-600/20 text-green-700 dark:text-green-400',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {questaoAtual.materia}
                {questaoAtual.assunto ? ` — ${questaoAtual.assunto}` : ''}
              </Badge>
              {questaoAtual.origem === 'gerada_ia' && (
                <Badge variant="outline">Gerada por IA</Badge>
              )}
              {questaoAtual.tipo_questao === 'certo_errado' && (
                <Badge variant="outline">Certo/Errado</Badge>
              )}
              {questaoAtual.tipo_questao === 'discursiva' && (
                <Badge variant="outline">Discursiva</Badge>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={toggleMarcar}>
              <Flag
                className={cn(
                  'h-4 w-4',
                  marcadas.includes(questaoAtual.id) && 'fill-yellow-400 text-yellow-400',
                )}
              />
            </Button>
          </div>

          <p className="whitespace-pre-wrap text-sm">{questaoAtual.enunciado}</p>

          {questaoAtual.tipo_questao === 'discursiva' ? (
            <div className="grid gap-2">
              <Label htmlFor={`resp-${questaoAtual.id}`}>Sua resposta</Label>
              <Textarea
                id={`resp-${questaoAtual.id}`}
                rows={5}
                placeholder="Escreva sua resposta…"
                value={respostas[questaoAtual.id] ?? ''}
                onChange={(e) => responder(e.target.value)}
              />
            </div>
          ) : questaoAtual.tipo_questao === 'certo_errado' ? (
            <div className="grid gap-2">
              {['Certo', 'Errado'].map((op, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => responder(String(idx))}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm transition-colors',
                    respostas[questaoAtual.id] === String(idx)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50',
                  )}
                >
                  {op}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {(questaoAtual.alternativas ?? []).map((alt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => responder(String(idx))}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm transition-colors',
                    respostas[questaoAtual.id] === String(idx)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50',
                  )}
                >
                  <span className="mr-2 font-medium">{String.fromCharCode(65 + idx)})</span>
                  {alt}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={indice === 0} onClick={() => setIndice((i) => i - 1)}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          {respondidas} de {questoes.length} respondidas
        </span>
        <Button
          variant="outline"
          disabled={indice === questoes.length - 1}
          onClick={() => setIndice((i) => i + 1)}
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={confirmarFim} onOpenChange={setConfirmarFim}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar prova?</DialogTitle>
            <DialogDescription>
              Você respondeu {respondidas} de {questoes.length} questões. A prova será corrigida e
              você verá o resultado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmarFim(false)}>
              Continuar prova
            </Button>
            <Button onClick={finalizar}>Finalizar e corrigir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
