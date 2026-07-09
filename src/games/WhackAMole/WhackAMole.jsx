import { useEffect, useRef, useState } from 'react'
import { playBlip } from '../../sound/sound'

const HOLES = 9
const DURATION = 20 // seconds

// Tap the mole before it vanishes. Score = hits in the time limit; moles get
// faster as the clock ticks down.
export default function WhackAMole({ onGameOver }) {
  const [active, setActive] = useState(-1)
  const [hits, setHits] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const spawnTimer = useRef(null)
  const tickTimer = useRef(null)
  const activeRef = useRef(-1)
  const hitsRef = useRef(0)
  const endedRef = useRef(false)
  const timeLeftRef = useRef(DURATION)
  timeLeftRef.current = timeLeft

  useEffect(() => {
    // Countdown.
    tickTimer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) end()
        return t - 1
      })
    }, 1000)

    // Mole spawner — visible window shrinks over time.
    function loop() {
      const elapsed = DURATION - timeLeftRef.current
      const visible = Math.max(500, 1000 - elapsed * 25)
      const hole = Math.floor(Math.random() * HOLES)
      activeRef.current = hole
      setActive(hole)
      spawnTimer.current = setTimeout(() => {
        if (activeRef.current === hole) {
          activeRef.current = -1
          setActive(-1)
        }
        spawnTimer.current = setTimeout(loop, 200 + Math.random() * 350)
      }, visible)
    }
    loop()

    return () => {
      clearInterval(tickTimer.current)
      clearTimeout(spawnTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function end() {
    if (endedRef.current) return
    endedRef.current = true
    clearInterval(tickTimer.current)
    clearTimeout(spawnTimer.current)
    setTimeout(() => onGameOver(hitsRef.current), 400)
  }

  function whack(i) {
    if (i !== activeRef.current || endedRef.current) return
    hitsRef.current += 1
    setHits(hitsRef.current)
    playBlip(true)
    activeRef.current = -1
    setActive(-1)
  }

  return (
    <div className="whack">
      <div className="whack-stats">
        <span>⏱ {timeLeft}s</span>
        <span>Hits: {hits}</span>
      </div>
      <div className="whack-grid">
        {Array.from({ length: HOLES }, (_, i) => (
          <button
            key={i}
            className={`whack-hole ${active === i ? 'is-up' : ''}`}
            onClick={() => whack(i)}
          >
            {active === i ? '🐹' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
