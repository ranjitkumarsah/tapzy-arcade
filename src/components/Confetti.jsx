import { useEffect, useRef } from 'react'

// Lightweight canvas confetti burst. Self-contained, auto-cleans, and honors
// reduced-motion. Render it conditionally (e.g. on a new best) — it fires once.
export default function Confetti({ count = 90, duration = 1600 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const W = (canvas.width = window.innerWidth)
    const H = (canvas.height = window.innerHeight)
    const colors = ['#5eb5f7', '#3aa76d', '#edc850', '#ec6b56', '#9b7ede', '#f2994a']

    const parts = Array.from({ length: count }, () => ({
      x: W / 2,
      y: H * 0.34,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 1) * 12 - 4,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    }))

    let raf
    const start = performance.now()
    const frame = (now) => {
      const t = now - start
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        p.vy += 0.35
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, 1 - t / duration)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      if (t < duration) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [count, duration])

  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />
}
