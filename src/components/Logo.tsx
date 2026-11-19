import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Logotipo da NEXORA: marca-texto (N) em azul elétrico + tipografia.
 * Forma própria — nenhum asset externo.
 */
export function Logo({ className, showTagline = false, size = 'md' }: LogoProps) {
  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }
  const markSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }
  const nSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-elevation',
          markSizes[size],
        )}
      >
        <span className={cn('font-black text-white leading-none tracking-tighter', nSizes[size])}>
          N
        </span>
      </div>
      <div className="min-w-0">
        <span
          className={cn(
            'font-black tracking-tight leading-none text-foreground dark:bg-gradient-to-r dark:from-white dark:via-slate-200 dark:to-slate-400 dark:bg-clip-text dark:text-transparent',
            textSizes[size],
          )}
        >
          NEXORA
        </span>
        {showTagline && (
          <p className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5">
            Inteligência que transforma estudo em aprovação.
          </p>
        )}
      </div>
    </div>
  )
}

/** Tela de carregamento personalizada (splash) */
export function NexoraSplash({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background dark:bg-[#050505] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_-5px_rgba(56,189,248,0.6)] animate-pulse">
          <span className="text-2xl font-black text-white leading-none tracking-tighter">N</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xl font-black tracking-tight text-foreground">NEXORA</p>
        <p className="text-xs font-medium text-muted-foreground">
          {message || 'Carregando sua jornada...'}
        </p>
      </div>
      <div className="w-40 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 animate-loading-bar" />
      </div>
    </div>
  )
}
