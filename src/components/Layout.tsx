import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Target,
  BookOpenCheck,
  AlertCircle,
  MessageSquare,
  LogOut,
  Flame,
  Star,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
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
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Missão de Hoje', path: '/missao', icon: Target },
  { label: 'Plano de Estudos', path: '/plano', icon: BookOpenCheck },
  { label: 'Banco de Erros', path: '/erros', icon: AlertCircle },
  { label: 'Chat', path: '/chat', icon: MessageSquare },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [xp, setXp] = useState<number>(() => {
    return parseInt(localStorage.getItem('tdah_med_xp') || '250', 10)
  })
  const [streak, setStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('tdah_med_streak') || '4', 10)
  })

  useEffect(() => {
    const handleStorage = () => {
      setXp(parseInt(localStorage.getItem('tdah_med_xp') || '250', 10))
      setStreak(parseInt(localStorage.getItem('tdah_med_streak') || '4', 10))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const currentNav = navItems.find((item) => item.path === location.pathname)
  const currentTitle = currentNav ? currentNav.label : 'Missão Medicina'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans">
      {/* Desktop Sidebar (>=1025px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 shadow-subtle">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">
              Missão Medicina
            </h1>
            <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
              Sprints TDAH
            </p>
          </div>
        </div>

        {/* Navigation */}
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
                    ? 'bg-violet-50 text-violet-700 border-l-4 border-violet-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-violet-600' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Stat Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-violet-50 to-amber-50 border border-violet-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1 text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500" /> {streak} dias
              </span>
              <span className="flex items-center gap-1 text-violet-700">
                <Star className="w-4 h-4 fill-violet-500" /> {xp} XP
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-600 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((xp % 500) / 5, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 text-center font-medium">
              Nível Medicina • Próximo marco em {500 - (xp % 500)} XP
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{currentTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span>{streak}d</span>
            </div>

            {/* XP Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-extrabold shadow-2xs">
              <Star className="w-4 h-4 text-violet-600 fill-violet-500" />
              <span>{xp} XP</span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none focus:ring-2 focus:ring-violet-500 rounded-full">
                  <Avatar className="w-9 h-9 border border-violet-200 cursor-pointer">
                    <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white border border-slate-200 shadow-elevation"
              >
                <DropdownMenuLabel className="text-xs text-slate-500 font-semibold">
                  {user?.email || 'estudante@medicina.br'}
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 animate-fade-in max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (0-1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around z-30 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 text-[10px] font-bold',
                isActive
                  ? 'text-violet-700 scale-105 -translate-y-0.5'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-colors',
                  isActive ? 'bg-violet-100 text-violet-700' : 'bg-transparent',
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
