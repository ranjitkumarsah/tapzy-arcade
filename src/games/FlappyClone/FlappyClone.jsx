import { useEffect, useRef, useState } from 'react'

export default function FlappyClone({ onGameOver }) {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const endedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const W = canvas.clientWidth
    const H = canvas.clientHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    // Physics tuned relative to canvas size so it feels the same on any screen.
    const gravity = H * 1.6 // px / s^2
    const flapV = -H * 0.46 // px / s impulse
    const pipeSpeed = W * 0.55 // px / s
    const gap = H * 0.32
    const pipeW = W * 0.16
    const birdX = W * 0.28
    const birdR = W * 0.045

    const styles = getComputedStyle(document.documentElement)
    const accent = styles.getPropertyValue('--accent').trim() || '#5eb5f7'
    const cardColor = styles.getPropertyValue('--card').trim() || '#22303c'
    const pipeColor = '#3aa76d'

    let birdY = H * 0.45
    let vel = 0
    let pipes = [] // { x, gapY, passed }
    let localScore = 0
    let last = performance.now()
    let spawnTimer = 0
    let raf = 0
    let started = false

    const rand = (min, max) => min + Math.random() * (max - min)

    function reset() {
      pipes = []
      spawnTimer = 0
    }
    reset()

    function flap() {
      if (endedRef.current) return
      started = true
      vel = flapV
    }

    function end() {
      if (endedRef.current) return
      endedRef.current = true
      cancelAnimationFrame(raf)
      onGameOver(localScore)
    }

    function spawnPipe() {
      const gapY = rand(H * 0.2, H * 0.8 - gap)
      pipes.push({ x: W, gapY, passed: false })
    }

    function update(dt) {
      if (!started) return
      vel += gravity * dt
      birdY += vel * dt

      spawnTimer += dt
      if (spawnTimer > 1.5) {
        spawnTimer = 0
        spawnPipe()
      }

      for (const p of pipes) p.x -= pipeSpeed * dt
      pipes = pipes.filter((p) => p.x + pipeW > -10)

      // scoring + collision
      for (const p of pipes) {
        if (!p.passed && p.x + pipeW < birdX) {
          p.passed = true
          localScore += 1
          setScore(localScore)
        }
        const inX = birdX + birdR > p.x && birdX - birdR < p.x + pipeW
        const hit = birdY - birdR < p.gapY || birdY + birdR > p.gapY + gap
        if (inX && hit) end()
      }

      if (birdY + birdR > H || birdY - birdR < 0) end()
    }

    function draw() {
      ctx.fillStyle = cardColor
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = pipeColor
      for (const p of pipes) {
        ctx.fillRect(p.x, 0, pipeW, p.gapY)
        ctx.fillRect(p.x, p.gapY + gap, pipeW, H - p.gapY - gap)
      }

      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(birdX, birdY, birdR, 0, Math.PI * 2)
      ctx.fill()

      if (!started) {
        ctx.fillStyle = styles.getPropertyValue('--text').trim() || '#fff'
        ctx.font = `${Math.round(W * 0.05)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Tap to start', W / 2, H * 0.3)
      }
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.033) // clamp big frame gaps
      last = now
      update(dt)
      if (!endedRef.current) {
        draw()
        raf = requestAnimationFrame(loop)
      }
    }

    const onPointer = (e) => {
      e.preventDefault()
      flap()
    }
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        flap()
      }
    }
    canvas.addEventListener('touchstart', onPointer, { passive: false })
    canvas.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('touchstart', onPointer)
      canvas.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onGameOver])

  return (
    <div className="canvas-wrap">
      <div className="canvas-score">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas game-canvas--tall" />
      <div className="canvas-hint">Tap to flap</div>
    </div>
  )
}
