import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { LayoutDashboard, Gift, Bell, Settings, LogOut, Target } from 'lucide-react'
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

const navItems = [
  { label: 'Painel', path: '/responsavel', icon: LayoutDashboard },
  { label: 'Recompensas', path: '/responsavel/recompensas', icon: Gift },
  { label: 'Notificações', path: '/responsavel/notificacoes', icon: Bell },
  { label: 'Configurações', path: '/responsavel/config', icon: Settings },
]

export default function ResponsavelLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const currentNav = navItems.find((item) => item.path === location.pathname)
  const currentTitle = currentNav ? currentNav.label : 'Painel do Responsável'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 shadow-subtle">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-violet-600 flex items-center justify-center text-white shadow-md">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">
              Painel Responsável
            </h1>
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
              Gestão TDAH
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-500 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-amber-600' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{currentTitle}</h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none focus:ring-2 focus:ring-amber-500 rounded-full">
                <Avatar className="w-9 h-9 border border-amber-200 cursor-pointer">
                  <AvatarFallback className="bg-gradient-to-tr from-amber-500 to-violet-600 text-white font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase() || 'R'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border border-slate-200 shadow-elevation"
            >
              <DropdownMenuLabel className="text-xs text-slate-500 font-semibold">
                {user?.email || 'responsavel@skip.app'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 text-xs font-semibold cursor-pointer flex items-center gap-2"
                onClick={() => {
                  signOut()
                  navigate('/login')
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 animate-fade-in max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around z-30 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 text-[9px] font-bold',
                isActive
                  ? 'text-amber-700 scale-105 -translate-y-0.5'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-colors',
                  isActive ? 'bg-amber-100 text-amber-700' : 'bg-transparent',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
