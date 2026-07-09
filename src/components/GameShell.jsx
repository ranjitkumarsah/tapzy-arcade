import { Suspense, useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  showBackButton,
  setVerticalSwipes,
  shareApp,
} from '../telegram/initTelegram'
import { saveScore } from '../firebase/scores'
import { submitLeaderboardScore, getMyRank } from '../firebase/leaderboard'
import { adsEnabled, showRewarded } from '../ads/monetag'
import { spendPerk } from '../economy/spend'
import { PERKS } from '../economy/perks'
import { startMusic, stopMusic, playWin, playLose } from '../sound/sound'
import GameOverModal from './GameOverModal'
import SoundToggle from './SoundToggle'
import CoinChip from './CoinChip'
import WalletModal from './WalletModal'

// Wraps any game with a consistent interface. The game only needs to call
// onGameOver(score); GameShell saves the score, shows the modal, handles retry,
// earning coins (rewarded ad), and Continue (spend coins to revive keeping score).
export default function GameShell({ game, onExit, onOpenLeaderboard }) {
  const { uid, telegramUser, wallet, maybeShowInterstitial, showGameOpenAd } = useApp()
  const [round, setRound] = useState(0) // bump to remount (retry/continue)
  const [continueScore, setContinueScore] = useState(0) // score carried on revive
  const [result, setResult] = useState(null)
  const [adMsg, setAdMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)

  const displayName = telegramUser?.first_name || telegramUser?.username || 'Player'
  const continueCost = PERKS.continue.cost

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

  useEffect(() => {
    const cleanup = showBackButton(onExit)
    return cleanup
  }, [onExit])

  useEffect(() => {
    setVerticalSwipes(false)
    return () => setVerticalSwipes(true)
  }, [])

  useEffect(() => {
    showGameOpenAd()
  }, [showGameOpenAd])

  // Background music; restart on retry/continue, stop when leaving.
  useEffect(() => {
    startMusic(game.id)
    return () => stopMusic()
  }, [game.id, round])

  const handleGameOver = useCallback(
    async (rawScore) => {
      stopMusic()
      const r = await persist(rawScore)
      if (r.isRecord) playWin()
      else playLose()
      setResult(r)
      setAdMsg(null)
    },
    [persist],
  )

  const handleRetry = useCallback(async () => {
    await maybeShowInterstitial()
    setContinueScore(0)
    setResult(null)
    setRound((r) => r + 1)
  }, [maybeShowInterstitial])

  const handleExitFromModal = useCallback(async () => {
    await maybeShowInterstitial()
    onExit()
  }, [maybeShowInterstitial, onExit])

  // Rewarded ad → coins credited server-side via the S2S postback (balance
  // updates live). We only show the ad; we never credit on the client.
  const handleEarnCoins = useCallback(async () => {
    setBusy(true)
    setAdMsg('Loading ad…')
    const watched = await showRewarded(uid ? uid.replace('tg_', '') : undefined)
    setBusy(false)
    setAdMsg(watched ? '🪙 Coins added to your wallet!' : 'Ad not completed.')
  }, [uid])

  // Spend coins to continue: revive keeping the current score.
  const handleContinue = useCallback(async () => {
    if (!result) return
    setBusy(true)
    setAdMsg('Reviving…')
    const res = await spendPerk('continue', { gameId: game.id, score: result.score })
    setBusy(false)
    if (!res.ok) {
      setAdMsg(res.reason === 'insufficient' ? 'Not enough coins.' : 'Continue failed.')
      return
    }
    setAdMsg(null)
    setContinueScore(result.score) // carry score into the revived run
    setResult(null)
    setRound((r) => r + 1)
  }, [result, game.id])

  const GameComponent = game.component
  const canContinue = Boolean(game.canContinue) && wallet.total >= continueCost

  return (
    <div className="game-shell">
      <header className="game-header">
        <button className="link-btn" onClick={onExit} aria-label="Back to menu">
          ← Menu
        </button>
        <span className="game-title">
          {game.icon} {game.title}
        </span>
        <div className="game-header-right">
          <CoinChip onClick={() => setWalletOpen(true)} />
          <SoundToggle />
        </div>
      </header>

      <div className="game-area">
        <Suspense fallback={<div className="loading">Loading…</div>}>
          <GameComponent
            key={round}
            onGameOver={handleGameOver}
            initialScore={continueScore}
          />
        </Suspense>
      </div>

      {result ? (
        <GameOverModal
          title={game.title}
          score={result.score}
          best={result.best}
          isRecord={result.isRecord}
          rank={result.rank}
          canContinue={canContinue}
          continueCost={continueCost}
          onContinue={handleContinue}
          canWatchAd={adsEnabled}
          onWatchAd={handleEarnCoins}
          busy={busy}
          adMsg={adMsg}
          onRetry={handleRetry}
          onExit={handleExitFromModal}
          onLeaderboard={onOpenLeaderboard ? () => onOpenLeaderboard(game.id) : null}
          onShare={() =>
            shareApp({
              ref: uid ? uid.replace('tg_', '') : undefined,
              text: `I scored ${result.score} in ${game.title} on Tapzy Arcade — can you beat me? 🎮`,
            })
          }
        />
      ) : null}

      {walletOpen ? <WalletModal onClose={() => setWalletOpen(false)} /> : null}
    </div>
  )
}
