import { useEffect, useRef, useState } from 'react'
import { playBlip } from '../../sound/sound'

const PADS = [0, 1, 2, 3]
const PAD_CLASS = ['pad-green', 'pad-red', 'pad-yellow', 'pad-blue']

// Repeat the growing color sequence. Score = sequence length reached.
export default function Simon({ onGameOver }) {
  const [phase, setPhase] = useState('idle') // idle | show | input | over
  const [lit, setLit] = useState(-1)
  const [level, setLevel] = useState(0)
  const seq = useRef([])
  const inputIdx = useRef(0)
  const timers = useRef([])
  const endedRef = useRef(false)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function playSequence(sequence) {
    setPhase('show')
    timers.current.forEach(clearTimeout)
    timers.current = []
    sequence.forEach((pad, i) => {
      timers.current.push(
        setTimeout(() => {
          setLit(pad)
          playBlip(true)
          timers.current.push(setTimeout(() => setLit(-1), 350))
        }, 600 * (i + 1)),
      )
    })
    timers.current.push(
      setTimeout(() => {
        inputIdx.current = 0
        setPhase('input')
      }, 600 * (sequence.length + 1)),
    )
  }

  function nextRound() {
    const pad = PADS[Math.floor(Math.random() * PADS.length)]
    seq.current = [...seq.current, pad]
    setLevel(seq.current.length)
    playSequence(seq.current)
  }

  function start() {
    seq.current = []
    endedRef.current = false
    nextRound()
  }

  function tap(pad) {
    if (phase !== 'input') return
    setLit(pad)
    playBlip(true)
    setTimeout(() => setLit(-1), 150)
    if (pad === seq.current[inputIdx.current]) {
      inputIdx.current += 1
      if (inputIdx.current === seq.current.length) {
        setPhase('show')
        setTimeout(nextRound, 700)
      }
    } else {
      // wrong → game over, score = fully-completed sequence length
      if (endedRef.current) return
      endedRef.current = true
      setPhase('over')
      setTimeout(() => onGameOver(seq.current.length - 1), 500)
    }
  }

  return (
    <div className="simon">
      <div className="simon-status">
        {phase === 'idle'
          ? 'Watch, then repeat'
          : phase === 'show'
            ? 'Watch…'
            : phase === 'input'
              ? 'Your turn'
              : 'Game over'}
      </div>
      <div className="simon-level">Level {level}</div>
      <div className="simon-pads">
        {PADS.map((pad) => (
          <button
            key={pad}
            className={`simon-pad ${PAD_CLASS[pad]} ${lit === pad ? 'is-lit' : ''}`}
            onClick={() => tap(pad)}
            disabled={phase !== 'input'}
            aria-label={`pad ${pad}`}
          />
        ))}
      </div>
      {phase === 'idle' ? (
        <button className="btn btn-primary" onClick={start}>
          ▶️ Start
        </button>
      ) : null}
    </div>
  )
}
