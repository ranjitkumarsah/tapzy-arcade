import { useRef } from 'react'

// Returns props to spread on an element to detect a swipe direction.
// onSwipe receives 'up' | 'down' | 'left' | 'right'.
// Pair with CSS `touch-action: none` on the element to stop page scroll.
export function useSwipe(onSwipe, threshold = 24) {
  const start = useRef(null)

  return {
    onTouchStart(e) {
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY }
    },
    onTouchEnd(e) {
      if (!start.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.current.x
      const dy = t.clientY - start.current.y
      start.current = null
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (Math.max(ax, ay) < threshold) return
      if (ax > ay) onSwipe(dx > 0 ? 'right' : 'left')
      else onSwipe(dy > 0 ? 'down' : 'up')
    },
  }
}
