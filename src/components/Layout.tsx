import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import { getNotifications, type NotificationRecord } from '@/services/premium'
import { getMaterias } from '@/services/materias'
import { getTopicos } from '@/services/topicos'
import { PanelLeftClose, PanelLeftOpen, Bell, LogOut, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import LayoutSidebar from './LayoutSidebar'
import GlobalSearch from './GlobalSearch'

const pageTitle: Record<string, string> = {
  '/': 'Início',
  '/dashboard': 'Dashboard',
  '/missao': 'Missão de Hoje',
  '/plano': 'Plano de Estudos',
  '/erros': 'Banco de Erros',
  '/chat': 'Chat',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
}

export interface SearchData {
  materias: { id: string; nome: string }[]
  topicos: { id: string; nome: string; materia_id: string }[]
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [searchData, setSearchData] = useState<SearchData>({
    materias: [],
    topicos: [],
  })

  // contagem de não-lidas da coleção nova "notifications" (central do estudante)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user?.id) return
      try {
        const list: NotificationRecord[] = await getNotifications(user.id)
        if (mounted) setUnread(list.filter((n) => !n.lida).length)
      } catch {
        /* sino apenas mostra 0 */
      }
    }
    load()
    const t = window.setInterval(load, 30000)
    return () => {
      mounted = false
      window.clearInterval(t)
    }
  }, [user?.id, location.pathname])

  // dados da busca global (matérias e tópicos)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [m, t] = await Promise.all([getMaterias(), getTopicos()])
        if (!mounted) return
        setSearchData({
          materias: m.map((x) => ({ id: x.id, nome: x.nome })),
          topicos: t.map((x) => ({ id: x.id, nome: x.titulo, materia_id: x.materia_id })),
        })
      } catch {
        /* busca global fica vazia */
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const currentTitle = pageTitle[location.pathname] || 'Plano de Estudos'

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar desktop (expansível/recolhível) */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out',
          collapsed ? 'lg:w-[68px]' : 'lg:w-64',
        )}
      >
        <LayoutSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Sidebar mobile (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border"
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <LayoutSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} mobile />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-[padding] duration-200 ease-in-out',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 lg:px-6 py-2.5 flex items-center gap-2 sm:gap-3">
          <button
            className="hidden lg:inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <button
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>

          <h2 className="hidden sm:block text-base font-bold tracking-tight truncate">
            {currentTitle}
          </h2>

          <div className="flex-1" />

          <GlobalSearch materias={searchData.materias} topicos={searchData.topicos} />

          {/* alternância de tema */}
          <button
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* sino de notificações com contagem de não-lidas */}
          <button
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => navigate('/notificacoes')}
            aria-label={`Notificações (${unread} não lidas)`}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* perfil do estudante logado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="w-9 h-9 border border-border cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'E'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {user?.name || 'Estudante'}
                </span>
                <span className="text-xs font-normal text-muted-foreground truncate">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate('/configuracoes')}
              >
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => {
                  signOut()
                  navigate('/login')
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 animate-fade-in w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
