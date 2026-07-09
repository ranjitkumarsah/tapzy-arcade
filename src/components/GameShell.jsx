import { Suspense, useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { showBackButton, hapticImpact, setVerticalSwipes } from '../telegram/initTelegram'
import { saveScore } from '../firebase/scores'
import { submitLeaderboardScore, getMyRank } from '../firebase/leaderboard'
import GameOverModal from './GameOverModal'

// Wraps any game with a consistent interface. The game only needs to call
// onGameOver(score); GameShell saves the score, shows the modal, and handles
// retry + back-to-menu (including Telegram's native BackButton).
export default function GameShell({ game, onExit, onOpenLeaderboard }) {
  const { uid, telegramUser } = useApp()
  const [round, setRound] = useState(0) // bump to remount (retry)
  const [result, setResult] = useState(null) // { score, best, isRecord, rank } | null

  const displayName =
    telegramUser?.first_name || telegramUser?.username || 'Player'

  // Telegram BackButton returns to the launcher.
  useEffect(() => {
    const cleanup = showBackButton(onExit)
    return cleanup
  }, [onExit])

  // Prevent pull-to-close from stealing swipes/taps while a game is open.
  useEffect(() => {
    setVerticalSwipes(false)
    return () => setVerticalSwipes(true)
  }, [])

  const handleGameOver = useCallback(
    async (rawScore) => {
      hapticImpact('medium')
      const { best, isRecord } = await saveScore(game.id, rawScore, uid)

      // Update the public leaderboard only when a personal best is beaten.
      let rank = null
      if (uid) {
        if (isRecord) await submitLeaderboardScore(game.id, best, displayName, uid)
        rank = await getMyRank(game.id, uid)
      }

      setResult({ score: Math.round(rawScore) || 0, best, isRecord, rank })
    },
    [game.id, uid, displayName],
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
          rank={result.rank}
          onRetry={handleRetry}
          onExit={onExit}
          onLeaderboard={
            onOpenLeaderboard ? () => onOpenLeaderboard(game.id) : null
          }
        />
      ) : null}
    </div>
  )
}
