import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getPerfilEstudo } from '@/services/perfil'
import { Logo, NexoraSplash } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  OBJETIVO_LABELS,
  NIVEL_LABELS,
  PREFERENCIA_LABELS,
  ObjetivoEstudo,
  NivelAtual,
  EstiloExplicacao,
  PreferenciaEstudo,
  savePerfilEstudo,
} from '@/services/perfil'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'

/**
 * Onboarding inteligente — aparece apenas no primeiro acesso de cadastros novos
 * (perfil_estudo.onboarding_concluido = false). Usuários existentes entram direto.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [objetivo, setObjetivo] = useState<ObjetivoEstudo | ''>('')
  const [horas, setHoras] = useState<number>(2)
  const [materiasDificeis, setMateriasDificeis] = useState('')
  const [nivel, setNivel] = useState<NivelAtual | ''>('')
  const [estilo, setEstilo] = useState<EstiloExplicacao | ''>('')
  const [preferencia, setPreferencia] = useState<PreferenciaEstudo | ''>('')
  const [checked, setChecked] = useState(false)

  // Usuários existentes (onboarding já concluído) entram direto no app.
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const p = await getPerfilEstudo(user.id)
        if (p?.onboarding_concluido) {
          navigate('/inicio', { replace: true })
          return
        }
      } catch {
        /* sem perfil ainda: segue no onboarding */
      }
      setChecked(true)
    })()
  }, [user])

  const totalSteps = 6
  const podeAvancar =
    (step === 0 && objetivo !== '') ||
    (step === 1 && horas >= 1 && horas <= 16) ||
    step === 2 ||
    (step === 3 && nivel !== '') ||
    (step === 4 && estilo !== '') ||
    (step === 5 && preferencia !== '')

  const finalizar = async () => {
    if (!user) return
    setSaving(true)
    setErrorMsg('')
    try {
      await savePerfilEstudo(user.id, {
        objetivo: objetivo || 'enem',
        horas_por_dia: horas,
        materias_dificeis: materiasDificeis,
        nivel_atual: nivel || 'iniciante',
        estilo_explicacao: estilo || 'resumido',
        preferencia_estudo: preferencia || 'questoes',
        onboarding_concluido: true,
      })
      navigate('/inicio', { replace: true })
    } catch {
      setErrorMsg('Não foi possível salvar. Verifique sua conexão e tente novamente.')
      setSaving(false)
    }
  }

  const opcoes = <T extends string>(
    valor: T | '',
    setValor: (v: T) => void,
    labels: Record<T, string>,
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(Object.keys(labels) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => setValor(k)}
          className={`text-left px-4 py-3.5 rounded-xl border text-sm font-bold transition-all ${
            valor === k
              ? 'border-blue-500 bg-blue-500/15 text-white shadow-[0_0_20px_-8px_rgba(59,130,246,0.8)]'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
          }`}
        >
          <span className="flex items-center justify-between gap-2">
            {labels[k]}
            {valor === k && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
          </span>
        </button>
      ))}
    </div>
  )

  const passos = [
    {
      pergunta: 'O que você deseja conquistar?',
      sub: 'Isso define o formato do seu plano de estudos.',
      conteudo: opcoes<ObjetivoEstudo>(objetivo, setObjetivo, OBJETIVO_LABELS),
    },
    {
      pergunta: 'Quantas horas por dia você pretende estudar?',
      sub: 'Seja honesto — um plano realista vale mais que um plano bonito.',
      conteudo: (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={horas}
              onChange={(e) => setHoras(parseInt(e.target.value, 10))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-2xl font-black text-blue-400 w-20 text-right shrink-0">
              {horas}h
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 6, 8].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHoras(h)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  horas === h
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      pergunta: 'Quais matérias são mais difíceis para você?',
      sub: 'Vamos dar prioridade extra a elas no cronograma. Separe por vírgula.',
      conteudo: (
        <div className="space-y-2">
          <Label
            htmlFor="materias"
            className="text-slate-400 text-xs font-bold uppercase tracking-wide"
          >
            Matérias (separadas por vírgula)
          </Label>
          <Input
            id="materias"
            type="text"
            placeholder="Ex.: Física, Química, Redação..."
            value={materiasDificeis}
            onChange={(e) => setMateriasDificeis(e.target.value)}
            className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
          />
          <p className="text-xs text-slate-500">
            Opcional — pode deixar em branco e ajustar depois nas Configurações.
          </p>
        </div>
      ),
    },
    {
      pergunta: 'Qual é o seu nível atual?',
      sub: 'Usamos isso para calibrar a dificuldade inicial das questões e explicações.',
      conteudo: opcoes<NivelAtual>(nivel, setNivel, NIVEL_LABELS),
    },
    {
      pergunta: 'Prefere explicações resumidas ou detalhadas?',
      sub: 'O Mentor IA se adapta ao formato que você aprende melhor.',
      conteudo: opcoes<EstiloExplicacao>(estilo, setEstilo, {
        resumido: 'Resumidas — direto ao ponto',
        detalhado: 'Detalhadas — com contexto e exemplos',
      } as Record<EstiloExplicacao, string>),
    },
    {
      pergunta: 'Como você prefere estudar?',
      sub: 'Escolha o formato que mais funciona com você.',
      conteudo: opcoes<PreferenciaEstudo>(preferencia, setPreferencia, PREFERENCIA_LABELS),
    },
  ]

  const atual = passos[step]

  // Se o usuário ainda não carregou, mostra splash; se não está logado, volta pro login.
  if (!user) {
    return <NexoraSplash message="Preparando seu onboarding..." />
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <Logo size="sm" />
          <span className="text-xs font-bold text-slate-500">
            Passo {step + 1} de {totalSteps}
          </span>
        </div>

        <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div key={step} className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{atual.pergunta}</h1>
          <p className="mt-2 text-sm text-slate-400 font-medium mb-6">{atual.sub}</p>
          {atual.conteudo}
        </div>

        {errorMsg && (
          <p className="mt-4 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate('/inicio') : setStep((s) => s - 1))}
            disabled={saving}
            className="text-slate-400 hover:text-white hover:bg-white/10 font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {step === 0 ? 'Pular' : 'Voltar'}
          </Button>

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!podeAvancar || saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={finalizar}
              disabled={!podeAvancar || saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Concluir'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
