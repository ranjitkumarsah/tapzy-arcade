import { Suspense, useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  showBackButton,
  hapticImpact,
  setVerticalSwipes,
  shareApp,
} from '../telegram/initTelegram'
import { saveScore } from '../firebase/scores'
import { submitLeaderboardScore, getMyRank } from '../firebase/leaderboard'
import { adsEnabled, showRewarded } from '../ads/monetag'
import { startMusic, stopMusic, playWin, playLose } from '../sound/sound'
import GameOverModal from './GameOverModal'
import SoundToggle from './SoundToggle'

// Wraps any game with a consistent interface. The game only needs to call
// onGameOver(score); GameShell saves the score, shows the modal, and handles
// retry + back-to-menu (including Telegram's native BackButton).
export default function GameShell({ game, onExit, onOpenLeaderboard }) {
  const { uid, telegramUser, maybeShowInterstitial, showGameOpenAd } = useApp()
  const [round, setRound] = useState(0) // bump to remount (retry)
  const [result, setResult] = useState(null) // { score, best, isRecord, rank, bonusClaimed } | null
  const [adMsg, setAdMsg] = useState(null)

  const displayName =
    telegramUser?.first_name || telegramUser?.username || 'Player'

  // Persist a score to Firestore + leaderboard and compute rank. Reused by
  // game-over and by the rewarded-ad bonus.
  const persist = useCallback(
    async (rawScore) => {
      const { best, isRecord } = await saveScore(game.id, rawScore, uid)
      let rank = null
      if (uid) {
        if (isRecord) await submitLeaderboardScore(game.id, best, displayName, uid)
        rank = await getMyRank(game.id, uid)
      }
      return { score: Math.round(rawScore) || 0, best, isRecord, rank }
    },
    [game.id, uid, displayName],
  )

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

  // Show an ad when the game opens (frequency-guarded; no-op if ads unconfigured).
  useEffect(() => {
    showGameOpenAd()
  }, [showGameOpenAd])

  // Background music for this game; restart on retry, stop when leaving.
  useEffect(() => {
    startMusic(game.id)
    return () => stopMusic()
  }, [game.id, round])

  const handleGameOver = useCallback(
    async (rawScore) => {
      stopMusic()
      const r = await persist(rawScore)
      // Celebrate a new personal best with win music; otherwise a lose sting.
      if (r.isRecord) playWin()
      else playLose()
      setResult({ ...r, bonusClaimed: false })
    },
    [persist],
  )

  const handleRetry = useCallback(async () => {
    await maybeShowInterstitial() // frequency-capped; usually instant
    setResult(null)
    setRound((r) => r + 1)
  }, [maybeShowInterstitial])

  const handleExitFromModal = useCallback(async () => {
    await maybeShowInterstitial()
    onExit()
  }, [maybeShowInterstitial, onExit])

  // Rewarded ad → grant a score bonus ONLY if the ad was actually watched.
  const handleWatchAd = useCallback(async () => {
    setAdMsg('Loading ad…')
    const watched = await showRewarded()
    if (!watched) {
      setAdMsg('Ad not completed — no bonus awarded.')
      return
    }
    setAdMsg(null)
    const base = result?.score ?? 0
    const bonus = base + Math.max(10, Math.round(base * 0.25))
    const r = await persist(bonus)
    setResult({ ...r, bonusClaimed: true })
  }, [persist, result])

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
        <SoundToggle />
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
          canWatchAd={adsEnabled && !result.bonusClaimed}
          onWatchAd={handleWatchAd}
          adMsg={adMsg}
          onRetry={handleRetry}
          onExit={handleExitFromModal}
          onLeaderboard={
            onOpenLeaderboard ? () => onOpenLeaderboard(game.id) : null
          }
          onShare={() =>
            shareApp({
              ref: uid ? uid.replace('tg_', '') : undefined,
              text: `I scored ${result.score} in ${game.title} on Tapzy Arcade — can you beat me? 🎮`,
            })
          }
        />
      ) : null}
    </div>
  )
}
