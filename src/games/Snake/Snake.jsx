import { useEffect, useRef, useState } from 'react'
import { playBlip } from '../../sound/sound'

const GRID = 15 // fewer, bigger cells = clearer and easier to control

export default function Snake({ onGameOver, initialScore = 0 }) {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(initialScore)
  const endedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const cssSize = canvas.clientWidth
    const dpr = window.devicePixelRatio || 1
    canvas.width = cssSize * dpr
    canvas.height = cssSize * dpr
    ctx.scale(dpr, dpr)
    const cell = cssSize / GRID

    const styles = getComputedStyle(document.documentElement)
    const accent = styles.getPropertyValue('--accent').trim() || '#5eb5f7'
    const cardColor = styles.getPropertyValue('--card').trim() || '#22303c'
    const bg = styles.getPropertyValue('--bg').trim() || '#17212b'
    const foodColor = '#ec6b56'

    const rand = (n) => Math.floor(Math.random() * n)
    let snake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ]
    let dir = { x: 1, y: 0 }
    const queue = [] // buffered turns (apply one per tick)
    let localScore = initialScore
    let step = 160 // ms/move — starts gentle
    let acc = 0
    let last = performance.now()
    let raf = 0

    function spawnFood() {
      let f
      do {
        f = { x: rand(GRID), y: rand(GRID) }
      } while (snake.some((s) => s.x === f.x && s.y === f.y))
      return f
    }
    let food = spawnFood()

    // Buffer up to 2 turns; reject reversals and duplicates relative to the
    // last *queued* direction so quick double-taps register correctly.
    function enqueue(d) {
      const ref = queue.length ? queue[queue.length - 1] : dir
      if (d.x === -ref.x && d.y === -ref.y) return
      if (d.x === ref.x && d.y === ref.y) return
      if (queue.length < 2) queue.push(d)
    }

    function end() {
      if (endedRef.current) return
      endedRef.current = true
      cancelAnimationFrame(raf)
      onGameOver(localScore)
    }

    function update() {
      if (queue.length) dir = queue.shift()
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= GRID ||
        head.y >= GRID ||
        snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        end()
        return
      }
      snake.unshift(head)
      if (head.x === food.x && head.y === food.y) {
        localScore += 1
        setScore(localScore)
        playBlip(true)
        food = spawnFood()
        step = Math.max(90, 160 - localScore * 2)
      } else {
        snake.pop()
      }
    }

    function roundRect(x, y, w, h, r) {
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, r)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, w, h)
      }
    }

    function draw() {
      // Checkerboard board.
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? cardColor : bg
          ctx.fillRect(x * cell, y * cell, cell, cell)
        }
      }
      // Food — glossy apple.
      const fx = food.x * cell + cell / 2
      const fy = food.y * cell + cell / 2
      const grad = ctx.createRadialGradient(
        fx - cell * 0.15,
        fy - cell * 0.15,
        cell * 0.1,
        fx,
        fy,
        cell * 0.5,
      )
      grad.addColorStop(0, '#ff9b8a')
      grad.addColorStop(1, foodColor)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(fx, fy, cell * 0.38, 0, Math.PI * 2)
      ctx.fill()

      // Snake — rounded, shaded segments.
      snake.forEach((s, i) => {
        const px = s.x * cell
        const py = s.y * cell
        const inset = cell * 0.08
        const g = ctx.createLinearGradient(px, py, px, py + cell)
        g.addColorStop(0, accent)
        g.addColorStop(1, accent + 'cc')
        ctx.fillStyle = i === 0 ? '#ffffff' : g
        if (i === 0) ctx.fillStyle = accent
        roundRect(px + inset, py + inset, cell - inset * 2, cell - inset * 2, cell * 0.28)
      })

      // Eyes on the head.
      const h = snake[0]
      const hx = h.x * cell + cell / 2
      const hy = h.y * cell + cell / 2
      const off = cell * 0.18
      const ex = dir.x * off
      const ey = dir.y * off
      const perpX = dir.y * off
      const perpY = dir.x * off
      ctx.fillStyle = '#fff'
      for (const sgn of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(hx + ex + sgn * perpX, hy + ey + sgn * perpY, cell * 0.09, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function loop(now) {
      const dt = Math.min(now - last, 100)
      last = now
      acc += dt
      if (acc >= step) {
        acc = 0
        update()
      }
      if (!endedRef.current) {
        draw()
        raf = requestAnimationFrame(loop)
      }
    }

    const keyMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    }
    const onKey = (e) => {
      if (keyMap[e.key]) {
        e.preventDefault()
        enqueue(keyMap[e.key])
      }
    }
    let ts = null
    const onTouchStart = (e) => {
      const t = e.touches[0]
      ts = { x: t.clientX, y: t.clientY }
    }
    const onTouchMove = (e) => {
      // Continuous swipe: turn as soon as a clear direction emerges.
      if (!ts) return
      const t = e.touches[0]
      const dx = t.clientX - ts.x
      const dy = t.clientY - ts.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return
      if (Math.abs(dx) > Math.abs(dy)) enqueue({ x: dx > 0 ? 1 : -1, y: 0 })
      else enqueue({ x: 0, y: dy > 0 ? 1 : -1 })
      ts = { x: t.clientX, y: t.clientY } // reset origin for the next turn
    }
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
    }
  }, [onGameOver, initialScore])

  return (
    <div className="canvas-wrap">
      <div className="canvas-score">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="canvas-hint">Swipe to steer</div>
    </div>
  )
}
