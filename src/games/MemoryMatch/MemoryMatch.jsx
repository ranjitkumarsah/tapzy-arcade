import { useEffect, useMemo, useRef, useState } from 'react'

// Level-based Memory Match.
//   - Pairs and difficulty scale with the level number (not hardcoded).
//   - Each level gives a budget of mismatches ("lives"); run out => game over.
//   - Clearing a level awards a bonus and advances to a bigger board.
const SYMBOLS = ['🍎', '🚀', '🎸', '⚽', '🐱', '🌟', '🍕', '🎲', '🦊', '🌈', '🐢', '🍔']

// Level 1 -> 3 pairs, growing by 1 each level, capped at all symbols.
function pairsForLevel(level) {
  return Math.min(2 + level, SYMBOLS.length)
}
function livesForLevel(level) {
  return pairsForLevel(level) + 2
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(level) {
  const n = pairsForLevel(level)
  const picked = shuffle(SYMBOLS).slice(0, n)
  return shuffle([...picked, ...picked]).map((symbol, i) => ({
    key: `${level}-${i}`,
    symbol,
    matched: false,
  }))
}

export default function MemoryMatch({ onGameOver }) {
  const [level, setLevel] = useState(1)
  const [deck, setDeck] = useState(() => buildDeck(1))
  const [flipped, setFlipped] = useState([])
  const [lives, setLives] = useState(() => livesForLevel(1))
  const [score, setScore] = useState(0)
  const [busy, setBusy] = useState(false)
  const endedRef = useRef(false)

  const matchedCount = useMemo(() => deck.filter((c) => c.matched).length, [deck])
  const cols = Math.min(4, Math.ceil(Math.sqrt(deck.length)))

  // Resolve a pair once two cards are face-up.
  useEffect(() => {
    if (flipped.length !== 2) return
    setBusy(true)
    const [a, b] = flipped
    const isMatch = deck[a].symbol === deck[b].symbol
    const t = setTimeout(
      () => {
        if (isMatch) {
          setDeck((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
          )
          setScore((s) => s + 10)
        } else {
          setLives((l) => l - 1)
        }
        setFlipped([])
        setBusy(false)
      },
      isMatch ? 350 : 750,
    )
    return () => clearTimeout(t)
  }, [flipped])

  // Game over when lives run out — fire once.
  useEffect(() => {
    if (endedRef.current) return
    if (lives <= 0) {
      endedRef.current = true
      const t = setTimeout(() => onGameOver(score), 700)
      return () => clearTimeout(t)
    }
  }, [lives, score, onGameOver])

  // Level cleared — award bonus and advance to a harder board.
  useEffect(() => {
    if (endedRef.current) return
    if (deck.length > 0 && matchedCount === deck.length) {
      const t = setTimeout(() => {
        setScore((s) => s + level * 50 + lives * 10)
        const next = level + 1
        setLevel(next)
        setDeck(buildDeck(next))
        setLives(livesForLevel(next))
        setFlipped([])
      }, 700)
      return () => clearTimeout(t)
    }
  }, [matchedCount, deck.length, level, lives])

  function handleFlip(i) {
    if (busy || flipped.includes(i) || deck[i].matched || flipped.length === 2) return
    setFlipped((prev) => [...prev, i])
  }

  return (
    <div className="memory">
      <div className="memory-stats">
        <span>Level {level}</span>
        <span>{'❤️'.repeat(Math.max(0, lives))}</span>
        <span>Score: {score}</span>
      </div>
      <div
        className="memory-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {deck.map((card, i) => {
          const faceUp = card.matched || flipped.includes(i)
          return (
            <button
              key={card.key}
              className={`memory-card ${faceUp ? 'is-up' : ''} ${card.matched ? 'is-matched' : ''}`}
              onClick={() => handleFlip(i)}
              disabled={faceUp || busy}
            >
              <span className="memory-face">{faceUp ? card.symbol : '❔'}</span>
            </button>
          )
        })}
      </div>
      <div className="memory-hint">Match all pairs. A wrong pair costs ❤️.</div>
    </div>
  )
}
