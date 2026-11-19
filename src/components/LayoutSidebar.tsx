import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  CalendarDays,
  Layers,
  XCircle,
  MessageCircle,
  Gift,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarNavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const navItems: SidebarNavItem[] = [
  { to: '/', label: 'Início', icon: Target },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/missao', label: 'Missão de Hoje', icon: CalendarDays },
  { to: '/plano', label: 'Plano de Estudos', icon: Layers },
  { to: '/mpc', label: 'MPC', icon: Layers },
  { to: '/erros', label: 'Banco de Erros', icon: XCircle },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface LayoutSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export default function LayoutSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  mobile = false,
}: LayoutSidebarProps) {
  const location = useLocation()

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'p-5 border-b border-sidebar-border flex items-center gap-3 min-h-[68px]',
          collapsed && !mobile && 'justify-center px-0',
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-elevation">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-tight text-sidebar-foreground leading-tight">
              Missão Medicina
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground leading-tight">
              Rotina de alta performance
            </p>
          </div>
        )}
        {/* Botão de recolher dentro da sidebar no mobile/espesso */}
        {!collapsed && !mobile && onToggle && (
          <button
            onClick={onToggle}
            className="ml-auto hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        {collapsed && !mobile && onToggle && (
          <button
            onClick={onToggle}
            className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Expandir menu"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed && !mobile ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-elevation'
                  : 'text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground',
                collapsed && !mobile && 'justify-center px-0',
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé da sidebar */}
      {(!collapsed || mobile) && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[11px] font-medium text-muted-foreground text-center">
            Foco de 15 min por vez
          </p>
        </div>
      )}
    </div>
  )
}
