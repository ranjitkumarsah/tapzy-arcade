import { useEffect, useRef, useState } from 'react'
import { playBlip } from '../../sound/sound'

const COLORS = [
  { name: 'RED', hex: '#ec6b56' },
  { name: 'GREEN', hex: '#3aa76d' },
  { name: 'BLUE', hex: '#5eb5f7' },
  { name: 'YELLOW', hex: '#edc850' },
  { name: 'PURPLE', hex: '#9b7ede' },
]
const DURATION = 30
const LIVES = 3

const rand = () => COLORS[Math.floor(Math.random() * COLORS.length)]

// Does the WORD match the INK color? Answer fast. Score = correct answers before
// time runs out or you lose all lives.
export default function ColorMatch({ onGameOver }) {
  const [q, setQ] = useState(() => ({ word: rand(), ink: rand() }))
  const [correct, setCorrect] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const correctRef = useRef(0)
  const livesRef = useRef(LIVES)
  const endedRef = useRef(false)
  const tick = useRef(null)

  useEffect(() => {
    tick.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) end()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(tick.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function end() {
    if (endedRef.current) return
    endedRef.current = true
    clearInterval(tick.current)
    setTimeout(() => onGameOver(correctRef.current), 400)
  }

  function answer(saidMatch) {
    if (endedRef.current) return
    const isMatch = q.word.name === q.ink.name
    if (saidMatch === isMatch) {
      correctRef.current += 1
      setCorrect(correctRef.current)
      playBlip(true)
    } else {
      livesRef.current -= 1
      setLives(livesRef.current)
      playBlip(false)
      if (livesRef.current <= 0) {
        end()
        return
      }
    }
    setQ({ word: rand(), ink: rand() })
  }

  return (
    <div className="colormatch">
      <div className="cm-stats">
        <span>⏱ {timeLeft}s</span>
        <span>{'❤️'.repeat(Math.max(0, lives))}</span>
        <span>Score: {correct}</span>
      </div>

      <div className="cm-word" style={{ color: q.ink.hex }}>
        {q.word.name}
      </div>
      <div className="cm-prompt">Does the word match its color?</div>

      <div className="cm-buttons">
        <button className="btn btn-reward" onClick={() => answer(true)}>
          ✓ Match
        </button>
        <button className="btn btn-secondary" onClick={() => answer(false)}>
          ✗ No match
        </button>
      </div>
    </div>
  )
}
