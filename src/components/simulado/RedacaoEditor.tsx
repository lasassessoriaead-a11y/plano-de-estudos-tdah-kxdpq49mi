import { useEffect, useRef, useState } from 'react'
import { PenLine, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { salvarTentativa, parseTemaMotivadores, type TemaRedacaoRecord } from '@/services/simulados'

// Estimativa: uma linha da folha de resposta do ENEM comporta ~9 palavras
const PALAVRAS_POR_LINHA = 9
const LINHAS_FOLHA_ENEM = 25

interface Props {
  tentativaId: string
  tema: TemaRedacaoRecord
  textoInicial: string
  onTextoChange?: (texto: string) => void
}

export default function RedacaoEditor({ tentativaId, tema, textoInicial, onTextoChange }: Props) {
  const [texto, setTexto] = useState(textoInicial)
  const [salvando, setSalvando] = useState(false)
  const [salvoAgora, setSalvoAgora] = useState(false)
  const textoRef = useRef(texto)
  textoRef.current = texto

  const motivadores = parseTemaMotivadores(tema)

  const palavras = texto.trim() ? texto.trim().split(/\s+/).filter(Boolean).length : 0
  const linhas = Math.ceil(palavras / PALAVRAS_POR_LINHA)
  const pctLinhas = Math.min(100, Math.round((linhas / LINHAS_FOLHA_ENEM) * 100))

  const persistir = async () => {
    setSalvando(true)
    try {
      await salvarTentativa(tentativaId, { redacaoTexto: textoRef.current })
      setSalvoAgora(true)
      window.setTimeout(() => setSalvoAgora(false), 2000)
    } catch {
      /* silencioso: o próximo intervalo tenta de novo */
    }
    setSalvando(false)
  }

  // autosave: 2,5s após parar de digitar + intervalo de 20s
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (textoRef.current !== textoInicial) persistir()
    }, 2500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto])

  useEffect(() => {
    const iv = window.setInterval(() => {
      if (textoRef.current !== textoInicial) persistir()
    }, 20000)
    return () => window.clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      {/* tema + textos motivadores */}
      <Card className="border-violet-200">
        <CardContent className="pt-5 pb-5 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wide flex items-center gap-1.5">
            <PenLine className="w-4 h-4" /> Redação · Tema
          </p>
          <p className="text-lg font-black text-slate-900 leading-snug">{tema.titulo}</p>
          <div className="space-y-3 pt-1">
            {motivadores.map((m, i) => (
              <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                <p className="text-xs font-bold text-slate-500 mb-1">Texto motivador {i + 1}</p>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{m}</p>
              </div>
            ))}
          </div>
          {tema.instrucoes && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
              <p className="text-xs font-bold text-amber-700 mb-1">Instruções</p>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                {tema.instrucoes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* editor */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">Seu texto</p>
            <div className="flex items-center gap-2 text-xs font-semibold">
              {salvando ? (
                <span className="flex items-center gap-1 text-slate-400">
                  <Save className="w-3.5 h-3.5 animate-pulse" /> Salvando…
                </span>
              ) : salvoAgora ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Save className="w-3.5 h-3.5" /> Salvo
                </span>
              ) : (
                <span className="text-slate-400">Salvamento automático ativo</span>
              )}
            </div>
          </div>
          <Textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              onTextoChange?.(e.target.value)
            }}
            placeholder="Escreva sua redação aqui… (texto argumentativo-dissertativo, 4 a 5 parágrafos)"
            className="min-h-[360px] text-sm leading-relaxed font-medium rounded-xl"
          />
          {/* contadores */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                {palavras} {palavras === 1 ? 'palavra' : 'palavras'}
              </span>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-lg border',
                  linhas > LINHAS_FOLHA_ENEM
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200',
                )}
              >
                ≈ {linhas} de {LINHAS_FOLHA_ENEM} linhas
              </span>
              {linhas > LINHAS_FOLHA_ENEM && (
                <span className="text-red-600">
                  Acima do espaço da folha de resposta do ENEM ({LINHAS_FOLHA_ENEM} linhas)!
                </span>
              )}
            </div>
            <div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    linhas > LINHAS_FOLHA_ENEM ? 'bg-red-500' : 'bg-violet-600',
                  )}
                  style={{ width: `${pctLinhas}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Estimativa: ~{PALAVRAS_POR_LINHA} palavras por linha da folha do ENEM (
                {LINHAS_FOLHA_ENEM} linhas no total)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
