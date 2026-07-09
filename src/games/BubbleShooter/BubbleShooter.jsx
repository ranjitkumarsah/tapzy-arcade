import { useEffect, useRef, useState } from 'react'
import { playBlip } from '../../sound/sound'

const COLS = 8
const START_ROWS = 5
const COLORS = ['#ec6b56', '#5eb5f7', '#3aa76d', '#edc850', '#9b7ede']

// Aim and shoot bubbles; 3+ of a color pop. Board grows on mismatches; clear it
// to win, or it's game over if bubbles reach the shooter.
export default function BubbleShooter({ onGameOver }) {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const R = W / (COLS * 2)
    const rowH = R * 1.732
    const shooterY = H - R * 1.4
    const MAXROW = Math.floor((shooterY - R * 2) / rowH)

    const rand = (n) => Math.floor(Math.random() * n)
    const center = (r, c) => ({
      x: (r % 2 === 0 ? R : 2 * R) + c * 2 * R,
      y: R + r * rowH,
    })
    const colsIn = (r) => (r % 2 === 0 ? COLS : COLS - 1)

    // grid[r][c] = color index or null
    const grid = []
    for (let r = 0; r < MAXROW + 1; r++) {
      grid[r] = new Array(colsIn(r)).fill(null)
      if (r < START_ROWS) for (let c = 0; c < colsIn(r); c++) grid[r][c] = rand(COLORS.length)
    }

    function neighbors(r, c) {
      const even = r % 2 === 0
      const list = even
        ? [[r, c - 1], [r, c + 1], [r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]]
        : [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]]
      return list.filter(([nr, nc]) => nr >= 0 && nr <= MAXROW && nc >= 0 && nc < colsIn(nr))
    }
    const filled = (r, c) => grid[r] && grid[r][c] != null

    function nearestEmpty(px, py) {
      let best = null
      let bestD = Infinity
      for (let r = 0; r <= MAXROW; r++) {
        for (let c = 0; c < colsIn(r); c++) {
          if (filled(r, c)) continue
          const anchored = r === 0 || neighbors(r, c).some(([nr, nc]) => filled(nr, nc))
          if (!anchored) continue
          const p = center(r, c)
          const d = (p.x - px) ** 2 + (p.y - py) ** 2
          if (d < bestD) {
            bestD = d
            best = { r, c }
          }
        }
      }
      return best
    }

    function cluster(r, c, color) {
      const seen = new Set()
      const stack = [[r, c]]
      const out = []
      while (stack.length) {
        const [cr, cc] = stack.pop()
        const key = `${cr},${cc}`
        if (seen.has(key)) continue
        seen.add(key)
        if (grid[cr]?.[cc] !== color) continue
        out.push([cr, cc])
        neighbors(cr, cc).forEach((n) => stack.push(n))
      }
      return out
    }

    function dropFloating() {
      const anchored = new Set()
      const stack = []
      for (let c = 0; c < colsIn(0); c++) if (filled(0, c)) stack.push([0, c])
      while (stack.length) {
        const [r, c] = stack.pop()
        const key = `${r},${c}`
        if (anchored.has(key)) continue
        anchored.add(key)
        neighbors(r, c).forEach(([nr, nc]) => {
          if (filled(nr, nc)) stack.push([nr, nc])
        })
      }
      let dropped = 0
      for (let r = 0; r <= MAXROW; r++) {
        for (let c = 0; c < colsIn(r); c++) {
          if (filled(r, c) && !anchored.has(`${r},${c}`)) {
            grid[r][c] = null
            dropped += 1
          }
        }
      }
      return dropped
    }

    let scoreVal = 0
    let ended = false
    let phase = 'aim' // aim | move
    let cur = rand(COLORS.length)
    let next = rand(COLORS.length)
    let ball = null // { x, y, vx, vy }
    let aim = { x: W / 2, y: shooterY - R * 3 }
    let raf = 0
    let lastT = performance.now()

    function boardEmpty() {
      for (let r = 0; r <= MAXROW; r++) for (let c = 0; c < colsIn(r); c++) if (filled(r, c)) return false
      return true
    }

    function end(win) {
      if (ended) return
      ended = true
      cancelAnimationFrame(raf)
      onGameOver(scoreVal + (win ? 200 : 0))
    }

    function place(px, py) {
      const cellRC = nearestEmpty(px, py)
      if (!cellRC) {
        end(false)
        return
      }
      const { r, c } = cellRC
      grid[r][c] = cur
      const cl = cluster(r, c, cur)
      if (cl.length >= 3) {
        cl.forEach(([rr, cc]) => (grid[rr][cc] = null))
        scoreVal += cl.length * 10 + dropFloating() * 20
        setScore(scoreVal)
        playBlip(true)
      } else {
        playBlip(false)
        if (center(r, c).y + R >= shooterY - R) {
          end(false)
          return
        }
      }
      if (boardEmpty()) {
        end(true)
        return
      }
      cur = next
      next = rand(COLORS.length)
      phase = 'aim'
    }

    function shoot() {
      if (phase !== 'aim') return
      let dx = aim.x - W / 2
      let dy = aim.y - shooterY
      const len = Math.hypot(dx, dy) || 1
      dx /= len
      dy /= len
      if (dy > -0.2) dy = -0.2 // always upward
      const speed = W * 1.4
      ball = { x: W / 2, y: shooterY, vx: dx * speed, vy: dy * speed }
      phase = 'move'
    }

    function step(dt) {
      if (phase !== 'move' || !ball) return
      ball.x += ball.vx * dt
      ball.y += ball.vy * dt
      if (ball.x < R) {
        ball.x = R
        ball.vx *= -1
      } else if (ball.x > W - R) {
        ball.x = W - R
        ball.vx *= -1
      }
      // collide with top or any bubble
      let hit = ball.y <= R
      if (!hit) {
        outer: for (let r = 0; r <= MAXROW; r++) {
          for (let c = 0; c < colsIn(r); c++) {
            if (!filled(r, c)) continue
            const p = center(r, c)
            if ((p.x - ball.x) ** 2 + (p.y - ball.y) ** 2 < (2 * R * 0.92) ** 2) {
              hit = true
              break outer
            }
          }
        }
      }
      if (hit) {
        const bx = ball.x
        const by = ball.y
        ball = null
        place(bx, by)
      }
    }

    function bubble(x, y, colorIdx) {
      const col = COLORS[colorIdx]
      const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R)
      g.addColorStop(0, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.35, col)
      g.addColorStop(1, 'rgba(0,0,0,0.25)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, R * 0.95, 0, Math.PI * 2)
      ctx.fill()
      // specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.arc(x - R * 0.32, y - R * 0.32, R * 0.18, 0, Math.PI * 2)
      ctx.fill()
    }

    function draw() {
      const styles = getComputedStyle(document.documentElement)
      ctx.fillStyle = styles.getPropertyValue('--bg').trim() || '#17212b'
      ctx.fillRect(0, 0, W, H)

      for (let r = 0; r <= MAXROW; r++) {
        for (let c = 0; c < colsIn(r); c++) {
          if (filled(r, c)) {
            const p = center(r, c)
            bubble(p.x, p.y, grid[r][c])
          }
        }
      }

      // aim guide
      if (phase === 'aim') {
        let dx = aim.x - W / 2
        let dy = Math.min(aim.y - shooterY, -R)
        const len = Math.hypot(dx, dy) || 1
        dx /= len
        dy /= len
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        for (let i = 1; i <= 6; i++) {
          ctx.beginPath()
          ctx.arc(W / 2 + dx * i * R * 1.4, shooterY + dy * i * R * 1.4, R * 0.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (ball) bubble(ball.x, ball.y, cur)
      // shooter + next
      bubble(W / 2, shooterY, cur)
      bubble(W - R * 1.1, shooterY, next)
    }

    function loop(now) {
      const dt = Math.min((now - lastT) / 1000, 0.033)
      lastT = now
      step(dt)
      if (!ended) {
        draw()
        raf = requestAnimationFrame(loop)
      }
    }

    function pos(e) {
      const rect = canvas.getBoundingClientRect()
      const p = e.touches ? e.touches[0] : e
      return { x: p.clientX - rect.left, y: p.clientY - rect.top }
    }
    const onMove = (e) => {
      aim = pos(e)
    }
    const onUp = (e) => {
      if (e.cancelable) e.preventDefault()
      aim = pos(e.changedTouches ? { touches: e.changedTouches } : e)
      shoot()
    }
    canvas.addEventListener('touchmove', onMove, { passive: true })
    canvas.addEventListener('touchend', onUp, { passive: false })
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onUp)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
    }
  }, [onGameOver])

  return (
    <div className="canvas-wrap">
      <div className="canvas-score">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas game-canvas--tall" />
      <div className="canvas-hint">Drag to aim, release to shoot</div>
    </div>
  )
}
