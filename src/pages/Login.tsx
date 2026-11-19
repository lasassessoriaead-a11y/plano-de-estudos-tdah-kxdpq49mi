import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      await pb.collection('users').authWithPassword(email, password)
      navigate('/inicio')
    } catch (error) {
      setErrorMsg(getErrorMessage(error) || 'E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="force-dark min-h-screen text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8">
          <h1 className="text-2xl font-black tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Entre para continuar sua jornada.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email.trim()) {
                      setErrorMsg('Digite seu e-mail acima para receber o link de recuperação.')
                      return
                    }
                    try {
                      await pb.collection('users').requestPasswordReset(email)
                      setErrorMsg('')
                      alert('Enviamos um link de recuperação para o seu e-mail.')
                    } catch {
                      setErrorMsg('Não foi possível enviar o link. Verifique o e-mail digitado.')
                    }
                  }}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
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
                  Entrar
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400 font-medium">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-bold text-blue-400 hover:text-blue-300">
              Comece sua jornada
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
