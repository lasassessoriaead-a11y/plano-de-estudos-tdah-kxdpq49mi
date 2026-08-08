import { useEffect, useRef } from 'react'

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      size: number
      color: string
      vx: number
      vy: number
    }> = []

    const colors = ['#7C3AED', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899']

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
      })
    }

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.y > canvas.height) p.y = -20
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      })
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationFrameId)
    }, 4000)

    return () => {
      cancelAnimationFrame(animationFrameId)
      clearTimeout(timeout)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />
}
