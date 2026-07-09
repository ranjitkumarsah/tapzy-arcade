import { useEffect, useMemo, useState } from 'react'

// 4x4 grid = 8 pairs. Score rewards fewer moves: max(100, 1000 - moves*40).
const SYMBOLS = ['🍎', '🚀', '🎸', '⚽', '🐱', '🌟', '🍕', '🎲', '🦊', '🌈', '🐢', '🍔']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck() {
  const picked = shuffle(SYMBOLS).slice(0, 8)
  return shuffle([...picked, ...picked]).map((symbol, i) => ({
    key: i,
    symbol,
    matched: false,
  }))
}

export default function MemoryMatch({ onGameOver }) {
  const [deck, setDeck] = useState(() => buildDeck())
  const [flipped, setFlipped] = useState([]) // indices currently face-up (0-2)
  const [moves, setMoves] = useState(0)
  const [busy, setBusy] = useState(false)

  const matchedCount = useMemo(() => deck.filter((c) => c.matched).length, [deck])

  // Win detection.
  useEffect(() => {
    if (matchedCount === deck.length) {
      const score = Math.max(100, 1000 - moves * 40)
      const t = setTimeout(() => onGameOver(score), 600)
      return () => clearTimeout(t)
    }
  }, [matchedCount, deck.length, moves, onGameOver])

  // Resolve a pair once two cards are face-up.
  useEffect(() => {
    if (flipped.length !== 2) return
    setBusy(true)
    const [a, b] = flipped
    const isMatch = deck[a].symbol === deck[b].symbol
    const t = setTimeout(() => {
      if (isMatch) {
        setDeck((prev) =>
          prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
        )
      }
      setFlipped([])
      setBusy(false)
    }, isMatch ? 350 : 750)
    return () => clearTimeout(t)
  }, [flipped, deck])

  function handleFlip(i) {
    if (busy || flipped.includes(i) || deck[i].matched || flipped.length === 2) return
    const next = [...flipped, i]
    setFlipped(next)
    if (next.length === 2) setMoves((m) => m + 1)
  }

  return (
    <div className="memory">
      <div className="memory-stats">
        <span>Moves: {moves}</span>
        <span>
          Matched: {matchedCount / 2}/{deck.length / 2}
        </span>
      </div>
      <div className="memory-grid">
        {deck.map((card, i) => {
          const faceUp = card.matched || flipped.includes(i)
          return (
            <button
              key={card.key}
              className={`memory-card ${faceUp ? 'is-up' : ''} ${card.matched ? 'is-matched' : ''}`}
              onClick={() => handleFlip(i)}
              disabled={faceUp}
            >
              <span className="memory-face">{faceUp ? card.symbol : '❔'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
