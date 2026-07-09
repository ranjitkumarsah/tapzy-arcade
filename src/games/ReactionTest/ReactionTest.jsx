import { useEffect, useRef, useState } from 'react'
import { playBlip } from '../../sound/sound'

const ROUNDS = 5

// Tap when it turns green. Score rewards faster reactions (sum of 500-ms/round).
export default function ReactionTest({ onGameOver }) {
  const [phase, setPhase] = useState('idle') // idle | waiting | go | result | early | done
  const [round, setRound] = useState(0)
  const [last, setLast] = useState(null)
  const goTime = useRef(0)
  const timer = useRef(null)
  const scoreRef = useRef(0)
  const endedRef = useRef(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  function startRound() {
    setPhase('waiting')
    setLast(null)
    timer.current = setTimeout(
      () => {
        goTime.current = performance.now()
        setPhase('go')
      },
      900 + Math.random() * 2200,
    )
  }

  function finish() {
    if (endedRef.current) return
    endedRef.current = true
    setPhase('done')
    setTimeout(() => onGameOver(scoreRef.current), 700)
  }

  function handleTap() {
    if (phase === 'idle' || phase === 'early') {
      startRound()
      return
    }
    if (phase === 'waiting') {
      clearTimeout(timer.current)
      setPhase('early')
      return
    }
    if (phase === 'go') {
      const ms = Math.round(performance.now() - goTime.current)
      playBlip(true)
      scoreRef.current += Math.max(0, 500 - ms)
      setLast(ms)
      const next = round + 1
      setRound(next)
      if (next >= ROUNDS) {
        finish()
      } else {
        setPhase('result')
        timer.current = setTimeout(startRound, 850)
      }
    }
  }

  const text = {
    idle: 'Tap to start',
    waiting: 'Wait for green…',
    go: 'TAP!',
    result: last != null ? `${last} ms` : '',
    early: 'Too soon! Tap to retry',
    done: 'Done!',
  }[phase]

  return (
    <div className={`reaction reaction--${phase}`} onClick={handleTap}>
      <div className="reaction-round">
        Round {Math.min(round + (phase === 'go' || phase === 'waiting' ? 1 : 0), ROUNDS)}/{ROUNDS}
      </div>
      <div className="reaction-text">{text}</div>
      <div className="reaction-score">Score: {scoreRef.current}</div>
    </div>
  )
}
