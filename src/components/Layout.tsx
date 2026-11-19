import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { getMaterias } from '@/services/materias'
import { getTopicos } from '@/services/topicos'
import { getNotifications } from '@/services/premium'
import { getPerfilEstudo } from '@/services/perfil'
import { useAuth } from '@/hooks/use-auth'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import LayoutSidebar from '@/components/LayoutSidebar'
import GlobalSearch from '@/components/GlobalSearch'
import { NexoraSplash } from '@/components/Logo'
import { Bell, LogOut, Menu, Search } from 'lucide-react'

export interface SearchData {
  materias: { id: string; nome: string }[]
  topicos: { id: string; nome: string; materia_id: string }[]
}

export default function Layout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchData, setSearchData] = useState<SearchData>({ materias: [], topicos: [] })
  const [naoLidas, setNaoLidas] = useState(0)
  const [nome, setNome] = useState('')
  const [onboardingPendente, setOnboardingPendente] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [m, t] = await Promise.all([getMaterias(), getTopicos()])
        setSearchData({
          materias: m.map((x) => ({ id: x.id, nome: x.nome })),
          topicos: t.map((x) => ({ id: x.id, nome: x.titulo, materia_id: x.materia_id })),
        })
      } catch {
        setSearchData({ materias: [], topicos: [] })
      }
    }
    load()
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (!user) return
    try {
      const list = await getNotifications(user.id)
      setNaoLidas(list.filter((n) => !n.lida).length)
    } catch {
      setNaoLidas(0)
    }
  }, [user])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  // Onboarding pendente (novos cadastros). Usuários existentes sem registro em
  // perfil_estudo entram direto — só redireciona quando o registro existe e
  // marca explicitamente onboarding_concluido = false.
  useEffect(() => {
    const check = async () => {
      if (!user) return
      try {
        const perfil = await getPerfilEstudo(user.id)
        setOnboardingPendente(!!perfil && !perfil.onboarding_concluido)
      } catch {
        setOnboardingPendente(false)
      }
    }
    check()
  }, [user])

  useEffect(() => {
    if (onboardingPendente) navigate('/onboarding', { replace: true })
  }, [onboardingPendente, navigate])

  useEffect(() => {
    if (user) {
      setNome(user.name || user.email?.split('@')[0] || '')
      setOnboardingPendente(false)
    }
  }, [user])

  const handleLogout = () => {
    pb.authStore.clear()
    navigate('/login')
  }

  if (!user) return <NexoraSplash message="Carregando sua jornada..." />

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex">
        <LayoutSidebar open={isMobile ? sidebarOpen : true} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/85 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <div className="hidden sm:flex items-center flex-1 max-w-md">
                <GlobalSearch materias={searchData.materias} topicos={searchData.topicos} />
              </div>
              <div className="sm:hidden flex-1" />
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-slate-400 hover:text-white hover:bg-white/10"
                  onClick={() => navigate('/notificacoes')}
                  aria-label="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {naoLidas > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </Button>
                <div className="hidden md:block text-right mr-1">
                  <p className="text-sm font-bold text-white leading-tight truncate max-w-[160px]">
                    {nome}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Estudante</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  aria-label="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {isMobile && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    readOnly
                    onFocus={(e) => {
                      e.target.blur()
                      setSidebarOpen(false)
                    }}
                    onClick={() => setSidebarOpen(true)}
                    placeholder="Buscar no menu..."
                    className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
