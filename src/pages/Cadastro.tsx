import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UsersRecordResponse, pb } from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo'
import { OBJETIVO_LABELS, ObjetivoEstudo, savePerfilEstudo } from '@/services/perfil'
import { Loader2, ArrowRight } from 'lucide-react'

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [objetivo, setObjetivo] = useState<ObjetivoEstudo>('enem')
  const [instituicoes, setInstituicoes] = useState('')
  const [dataProva, setDataProva] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, { message: string }>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setFieldErrors({})

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não conferem. Verifique e tente novamente.')
      return
    }

    setLoading(true)
    try {
      const created = await pb.collection('users').create<UsersRecordResponse>({
        name: nome,
        email,
        password,
        passwordConfirm: password,
        role: 'aluno',
      })

      // Perfil inicial de estudo (coleção perfil_estudo, owner-only).
      // O onboarding no primeiro acesso completa o restante das preferências.
      await savePerfilEstudo(created.id, {
        objetivo,
        instituicoes,
        data_prova: dataProva || '',
        onboarding_concluido: false,
      })

      await pb.collection('users').authWithPassword(email, password)
      navigate('/onboarding')
    } catch (error) {
      setFieldErrors(extractFieldErrors(error))
      setErrorMsg(getErrorMessage(error) || 'Não foi possível criar sua conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8">
          <h1 className="text-2xl font-black tracking-tight">Crie sua conta</h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Comece sua jornada com um plano feito para você.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-slate-300">
                Nome
              </Label>
              <Input
                id="nome"
                type="text"
                required
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 font-semibold">{fieldErrors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivo" className="text-slate-300">
                Objetivo de estudo
              </Label>
              <select
                id="objetivo"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value as ObjetivoEstudo)}
                className="w-full h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {(Object.keys(OBJETIVO_LABELS) as ObjetivoEstudo[]).map((k) => (
                  <option key={k} value={k} className="bg-[#0a0a0c] text-white">
                    {OBJETIVO_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituicoes" className="text-slate-300">
                Instituições / provas desejadas{' '}
                <span className="text-slate-500 font-normal">(opcional)</span>
              </Label>
              <Input
                id="instituicoes"
                type="text"
                placeholder="Ex.: UNICAMP, UNESP, ESA..."
                value={instituicoes}
                onChange={(e) => setInstituicoes(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataProva" className="text-slate-300">
                Data prevista da prova{' '}
                <span className="text-slate-500 font-normal">(se houver)</span>
              </Label>
              <Input
                id="dataProva"
                type="date"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl [color-scheme:dark]"
              />
            </div>

            {errorMsg && (
              <p className="text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-6 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Começar minha jornada
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400 font-medium">
            Já tem conta?{' '}
            <Link to="/login" className="font-bold text-blue-400 hover:text-blue-300">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
