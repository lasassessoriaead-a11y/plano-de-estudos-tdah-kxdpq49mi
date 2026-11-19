import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Pencil, PenLine, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  COMPETENCIAS_REDACAO,
  avaliarRedacao,
  getTentativa,
  parseAvaliacaoRedacao,
  salvarTentativa,
  somaAvaliacaoRedacao,
  type TentativaRecord,
} from '@/services/simulados'

interface Props {
  tentativa: TentativaRecord
  temaTitulo?: string
  onAtualizada: (t: TentativaRecord) => void
}

export default function RedacaoResultadoCard({ tentativa, temaTitulo, onAtualizada }: Props) {
  const { toast } = useToast()
  const [avaliando, setAvaliando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [notaReal, setNotaReal] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)

  const avaliacao = parseAvaliacaoRedacao(tentativa)

  useEffect(() => {
    setNotaReal(
      tentativa.redacao_nota_real !== null && tentativa.redacao_nota_real !== undefined
        ? String(tentativa.redacao_nota_real)
        : '',
    )
  }, [tentativa])

  const avaliar = async () => {
    setAvaliando(true)
    try {
      await avaliarRedacao(tentativa.id)
      onAtualizada(await getTentativa(tentativa.id))
      toast({ title: 'Redação avaliada', description: 'Estimativa automática gerada.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      toast({
        title: 'Erro na avaliação',
        description: msg || 'A IA não conseguiu avaliar a redação. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAvaliando(false)
    }
  }

  const salvarNotaReal = async () => {
    const n = Number(notaReal.replace(',', '.'))
    if (Number.isNaN(n) || n < 0 || n > 1000) {
      toast({
        title: 'Nota inválida',
        description: 'Informe uma nota entre 0 e 1000.',
        variant: 'destructive',
      })
      return
    }
    setSalvandoNota(true)
    try {
      await salvarTentativa(tentativa.id, { notaRedacaoReal: n })
      onAtualizada(await getTentativa(tentativa.id))
      setEditando(false)
      toast({ title: 'Nota real registrada' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a nota real.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoNota(false)
    }
  }

  const temTexto = Boolean(tentativa.redacao_texto && tentativa.redacao_texto.trim())
  const soma = avaliacao ? somaAvaliacaoRedacao(avaliacao) : null

  return (
    <Card className="border-emerald-200">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-emerald-600" />
          <CardTitle className="text-sm font-bold">Redação</CardTitle>
          {temaTitulo && (
            <span className="text-xs font-semibold text-slate-500 truncate">— {temaTitulo}</span>
          )}
        </div>
        {temTexto && (
          <div className="flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-amber-800">
              Avaliação automática (NÃO oficial — não substitui a correção humana do INEP). Use como
              treino e referência de evolução.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!temTexto ? (
          <p className="text-sm text-slate-500 font-medium">
            Nenhuma redação escrita nesta tentativa.
          </p>
        ) : !avaliacao ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 font-medium">
              Redação enviada ({tentativa.redacao_texto!.trim().split(/\s+/).length} palavras).
              Ainda não avaliada.
            </p>
            <Button
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
              onClick={avaliar}
              disabled={avaliando}
            >
              {avaliando ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Avaliando com IA…
                </>
              ) : (
                <>
                  <PenLine className="w-4 h-4 mr-1" /> Avaliar redação (estimativa IA)
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* soma geral */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5">
                <p className="text-3xl font-black text-emerald-700">{soma}</p>
                <p className="text-[11px] font-bold text-emerald-600">/1000 · soma C1–C5</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={avaliar}
                disabled={avaliando}
              >
                <RefreshCw className={cn('w-4 h-4 mr-1', avaliando && 'animate-spin')} /> Reavaliar
              </Button>
            </div>

            {/* competências */}
            <div className="space-y-3">
              {avaliacao.competencias.map((comp) => {
                const label =
                  COMPETENCIAS_REDACAO.find((c) => c.codigo === comp.codigo)?.label ??
                  `C${comp.codigo}`
                return (
                  <div
                    key={comp.codigo}
                    className="rounded-xl border border-slate-200 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p
                        className={cn(
                          'text-sm font-black',
                          comp.nota >= 160
                            ? 'text-emerald-600'
                            : comp.nota >= 80
                              ? 'text-amber-600'
                              : 'text-red-600',
                        )}
                      >
                        {comp.nota}
                        <span className="text-xs font-bold text-slate-400">/200</span>
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          comp.nota >= 160
                            ? 'bg-emerald-500'
                            : comp.nota >= 80
                              ? 'bg-amber-500'
                              : 'bg-red-500',
                        )}
                        style={{ width: `${(comp.nota / 200) * 100}%` }}
                      />
                    </div>
                    {comp.pontos_fortes && (
                      <p className="text-xs text-slate-600 font-medium">
                        <span className="font-bold text-emerald-700">Pontos fortes:</span>{' '}
                        {comp.pontos_fortes}
                      </p>
                    )}
                    {comp.a_melhorar && (
                      <p className="text-xs text-slate-600 font-medium">
                        <span className="font-bold text-amber-700">A melhorar:</span>{' '}
                        {comp.a_melhorar}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {avaliacao.comentario_geral && (
              <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
                <p className="text-xs font-black text-violet-700 mb-1">Comentário geral</p>
                <p className="text-sm text-violet-900 leading-relaxed">
                  {avaliacao.comentario_geral}
                </p>
              </div>
            )}

            {/* texto escrito */}
            <div className="rounded-lg bg-slate-50 p-3 max-h-56 overflow-y-auto">
              <p className="text-xs font-black text-slate-700 mb-1">Texto da redação</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {tentativa.redacao_texto}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Notas geradas por IA no backend (estimativa). Use-as para treino, não como nota
              oficial.
            </p>
          </>
        )}

        {/* nota real (correção humana) */}
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-700">Nota real (correção humana)</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Registre a nota da correção oficial/professor para comparar com a estimativa.
              </p>
            </div>
            {!editando && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold shrink-0"
                onClick={() => setEditando(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                {tentativa.redacao_nota_real != null ? 'Editar' : 'Registrar'}
              </Button>
            )}
          </div>
          {tentativa.redacao_nota_real != null && !editando && (
            <p className="mt-2 text-sm font-black text-emerald-700">
              <Check className="w-4 h-4 inline mr-1" />
              Nota real: {tentativa.redacao_nota_real}/1000
              {soma !== null && (
                <span className="text-xs font-semibold text-slate-500 ml-2">
                  (estimativa IA: {soma})
                </span>
              )}
            </p>
          )}
          {editando && (
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                min={0}
                max={1000}
                value={notaReal}
                onChange={(e) => setNotaReal(e.target.value)}
                placeholder="Ex.: 820"
                className="rounded-xl font-bold max-w-[140px]"
              />
              <Button
                size="sm"
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
                onClick={salvarNotaReal}
                disabled={salvandoNota}
              >
                {salvandoNota ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
