import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Target, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setFieldErrors({})
    setLoading(true)

    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setFieldErrors(extractFieldErrors(error))
      setErrorMsg(getErrorMessage(error) || 'Email ou senha inválidos.')
    } else {
      navigate('/')
    }
  }

  const fillDemo = () => {
    setEmail('luka2510@hotmail.com')
    setPassword('Skip@Pass')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-elevation space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-amber-500 text-white shadow-md mb-2">
            <Target className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Missão Medicina TDAH
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Aprovação em Medicina com Sprints de 15 minutos
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-sm rounded-xl border-slate-200 focus:border-violet-500"
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-sm rounded-xl border-slate-200 focus:border-violet-500"
                required
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl py-2.5 shadow-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
          <button
            type="button"
            onClick={fillDemo}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Usar conta de demonstração (luka2510@hotmail.com)</span>
          </button>

          <p className="text-xs text-center text-slate-500 font-medium">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-violet-600 font-bold hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
