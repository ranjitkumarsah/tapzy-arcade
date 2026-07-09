import { useEffect, useRef, useState } from 'react'

const GRID = 17 // cells per side

export default function Snake({ onGameOver }) {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const endedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Crisp sizing for the device pixel ratio.
    const cssSize = canvas.clientWidth
    const dpr = window.devicePixelRatio || 1
    canvas.width = cssSize * dpr
    canvas.height = cssSize * dpr
    ctx.scale(dpr, dpr)
    const cell = cssSize / GRID

    const rand = (n) => Math.floor(Math.random() * n)
    let snake = [{ x: 8, y: 8 }]
    let dir = { x: 1, y: 0 }
    let nextDir = { x: 1, y: 0 }
    let localScore = 0
    let step = 135 // ms per move
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

    // Theme-aware colors pulled from CSS variables.
    const styles = getComputedStyle(document.documentElement)
    const accent = styles.getPropertyValue('--accent').trim() || '#5eb5f7'
    const cardColor = styles.getPropertyValue('--card').trim() || '#22303c'
    const foodColor = '#ec6b56'

    function setDir(d) {
      if (d.x === -dir.x && d.y === -dir.y) return // no reversing
      nextDir = d
    }

    function end() {
      if (endedRef.current) return
      endedRef.current = true
      cancelAnimationFrame(raf)
      onGameOver(localScore)
    }

    function update() {
      dir = nextDir
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
        food = spawnFood()
        step = Math.max(70, 135 - localScore * 3) // speed up gradually
      } else {
        snake.pop()
      }
    }

    function draw() {
      ctx.fillStyle = cardColor
      ctx.fillRect(0, 0, cssSize, cssSize)
      // food
      ctx.fillStyle = foodColor
      ctx.fillRect(food.x * cell + 2, food.y * cell + 2, cell - 4, cell - 4)
      // snake
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? accent : accent + 'cc'
        ctx.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2)
      })
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

    // --- controls ---
    const keyMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    }
    const onKey = (e) => {
      if (keyMap[e.key]) {
        e.preventDefault()
        setDir(keyMap[e.key])
      }
    }
    let ts = null
    const onTouchStart = (e) => {
      const t = e.touches[0]
      ts = { x: t.clientX, y: t.clientY }
    }
    const onTouchEnd = (e) => {
      if (!ts) return
      const t = e.changedTouches[0]
      const dx = t.clientX - ts.x
      const dy = t.clientY - ts.y
      ts = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return
      if (Math.abs(dx) > Math.abs(dy)) setDir({ x: dx > 0 ? 1 : -1, y: 0 })
      else setDir({ x: 0, y: dy > 0 ? 1 : -1 })
    }
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [onGameOver])

  return (
    <div className="canvas-wrap">
      <div className="canvas-score">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="canvas-hint">Swipe to steer</div>
    </div>
  )
}
