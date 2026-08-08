import { useState, useEffect } from 'react'

export function BreathingCircle() {
  const [phase, setPhase] = useState<'inspire' | 'segure' | 'expire'>('inspire')

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => {
        if (prev === 'inspire') return 'segure'
        if (prev === 'segure') return 'expire'
        return 'inspire'
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative flex items-center justify-center w-48 h-48">
        <div
          className={`absolute rounded-full bg-gradient-to-br from-violet-500/30 to-amber-500/30 blur-md transition-all duration-[4000ms] ease-in-out ${
            phase === 'inspire'
              ? 'w-48 h-48 opacity-100'
              : phase === 'segure'
                ? 'w-44 h-48 opacity-90'
                : 'w-24 h-24 opacity-40'
          }`}
        />
        <div
          className={`relative z-10 flex items-center justify-center rounded-full bg-violet-600 text-white font-bold shadow-xl transition-all duration-[4000ms] ease-in-out ${
            phase === 'inspire'
              ? 'w-40 h-40 text-xl'
              : phase === 'segure'
                ? 'w-38 h-38 text-lg'
                : 'w-20 h-20 text-xs'
          }`}
        >
          {phase === 'inspire' && 'Inspire... 🌬️'}
          {phase === 'segure' && 'Segure... 🧘'}
          {phase === 'expire' && 'Expire... 💨'}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 max-w-xs">
        Pausa ativa de 3 minutos! Solte os ombros, beba uma água e relaxe o cérebro para fixar o
        aprendizado.
      </p>
    </div>
  )
}
