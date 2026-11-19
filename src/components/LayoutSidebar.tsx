import { Link, useLocation } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import {
  Home,
  Bot,
  CalendarDays,
  FileText,
  BookOpen,
  ClipboardList,
  Map,
  PenLine,
  History,
  MessageCircle,
  Settings,
} from 'lucide-react'

export const navItems = [
  { label: 'Início', to: '/', icon: Home },
  { label: 'Meu Mentor IA', to: '/chat', icon: Bot },
  { label: 'Cronograma', to: '/plano', icon: CalendarDays },
  { label: 'Central de Provas', to: '/central-provas', icon: FileText },
  { label: 'Banco de Questões', to: '/banco-questoes', icon: BookOpen },
  { label: 'Simulados', to: '/simulados', icon: ClipboardList },
  { label: 'Mapas Mentais', to: '/mapas-mentais', icon: Map },
  { label: 'Redação', to: '/redacao', icon: PenLine },
  { label: 'Histórico e Desempenho', to: '/historico', icon: History },
  { label: 'WhatsApp', to: '/whatsapp', icon: MessageCircle },
  { label: 'Configurações', to: '/configuracoes', icon: Settings },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function LayoutSidebar({ open, onClose }: Props) {
  const location = useLocation()
  const isMobile = useIsMobile()

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'w-64 shrink-0 border-r border-sidebar-border bg-sidebar-background flex flex-col h-screen sticky top-0 z-50 transition-transform duration-200',
          isMobile && `fixed top-0 left-0 h-full ${open ? 'translate-x-0' : '-translate-x-full'}`,
        )}
      >
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/inicio" onClick={onClose}>
            <Logo size="sm" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-primary/25'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent border border-transparent',
                )}
              >
                <Icon
                  className={cn(
                    'w-4.5 h-4.5 shrink-0 transition-colors',
                    active
                      ? 'text-sidebar-primary'
                      : 'text-muted-foreground/70 group-hover:text-sidebar-foreground',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] font-bold text-muted-foreground/60 text-center leading-relaxed">
            Inteligência que transforma estudo em aprovação.
          </p>
        </div>
      </aside>
    </>
  )
}
