import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { GAMES } from '../games/registry'
import { getTopScores } from '../firebase/leaderboard'
import { showBackButton } from '../telegram/initTelegram'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard({ initialGameId, onExit }) {
  const { uid } = useApp()
  const [gameId, setGameId] = useState(initialGameId || GAMES[0].id)
  const [rows, setRows] = useState(null) // null = loading

  useEffect(() => {
    const cleanup = showBackButton(onExit)
    return cleanup
  }, [onExit])

  useEffect(() => {
    let cancelled = false
    setRows(null)
    getTopScores(gameId, 50).then((r) => {
      if (!cancelled) setRows(r)
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  const activeGame = GAMES.find((g) => g.id === gameId)

  return (
    <div className="leaderboard">
      <header className="lb-header">
        <button className="link-btn" onClick={onExit}>
          ← Menu
        </button>
        <span className="lb-title">🏆 Leaderboard</span>
        <span className="game-header-spacer" />
      </header>

      <div className="lb-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`lb-tab ${g.id === gameId ? 'is-active' : ''}`}
            onClick={() => setGameId(g.id)}
          >
            <span>{g.icon}</span>
          </button>
        ))}
      </div>

      <div className="lb-game-name">
        {activeGame?.icon} {activeGame?.title}
      </div>

      {rows === null ? (
        <div className="loading">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="lb-empty">
          No scores yet — be the first to set a record! 🎮
        </div>
      ) : (
        <ol className="lb-list">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className={`lb-row ${(row.id || row.uid) === uid ? 'is-me' : ''}`}
            >
              <span className="lb-rank">{MEDALS[i] || i + 1}</span>
              <span className="lb-name">
                {row.displayName || 'Player'}
                {(row.id || row.uid) === uid ? ' (you)' : ''}
              </span>
              <span className="lb-score">{row.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
