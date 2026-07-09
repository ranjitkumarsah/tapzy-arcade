import { useEffect, useState } from 'react'

// Animate a number from 0 to `target` with ease-out. Honors reduced-motion.
export function useCountUp(target, duration = 700) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVal(target)
      return
    }
    let raf
    const start = performance.now()
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return val
}
