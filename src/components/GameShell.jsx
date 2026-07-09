import { Suspense, useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { showBackButton, hapticImpact } from '../telegram/initTelegram'
import { saveScore } from '../firebase/scores'
import GameOverModal from './GameOverModal'

// Wraps any game with a consistent interface. The game only needs to call
// onGameOver(score); GameShell saves the score, shows the modal, and handles
// retry + back-to-menu (including Telegram's native BackButton).
export default function GameShell({ game, onExit }) {
  const { uid } = useApp()
  const [round, setRound] = useState(0) // bump to remount (retry)
  const [result, setResult] = useState(null) // { score, best, isRecord } | null

  // Telegram BackButton returns to the launcher.
  useEffect(() => {
    const cleanup = showBackButton(onExit)
    return cleanup
  }, [onExit])

  const handleGameOver = useCallback(
    async (rawScore) => {
      hapticImpact('medium')
      const { best, isRecord } = await saveScore(game.id, rawScore, uid)
      setResult({ score: Math.round(rawScore) || 0, best, isRecord })
    },
    [game.id, uid],
  )

  const handleRetry = useCallback(() => {
    setResult(null)
    setRound((r) => r + 1)
  }, [])

  const GameComponent = game.component

  return (
    <div className="game-shell">
      <header className="game-header">
        <button className="link-btn" onClick={onExit} aria-label="Back to menu">
          ← Menu
        </button>
        <span className="game-title">
          {game.icon} {game.title}
        </span>
        <span className="game-header-spacer" />
      </header>

      <div className="game-area">
        <Suspense fallback={<div className="loading">Loading…</div>}>
          <GameComponent key={round} onGameOver={handleGameOver} />
        </Suspense>
      </div>

      {result ? (
        <GameOverModal
          title={game.title}
          score={result.score}
          best={result.best}
          isRecord={result.isRecord}
          onRetry={handleRetry}
          onExit={onExit}
        />
      ) : null}
    </div>
  )
}
