import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { GAMES } from '../games/registry'
import { getHighScore } from '../firebase/scores'
import { hapticImpact, shareApp, getStartParam } from '../telegram/initTelegram'
import SoundToggle from './SoundToggle'
import CoinChip from './CoinChip'
import WalletModal from './WalletModal'
import DailyModal from './DailyModal'
import InviteModal from './InviteModal'
import ProfileModal from './ProfileModal'
import StoreModal from './StoreModal'
import { getDailyStatus } from '../economy/daily'
import { syncReferral } from '../economy/referral'

// Home screen: header with the player, then a grid of game cards.
export default function Launcher({ onSelect, onOpenLeaderboard }) {
  const { telegramUser, uid } = useApp()
  const [bests, setBests] = useState({})
  const [walletOpen, setWalletOpen] = useState(false)
  const [dailyOpen, setDailyOpen] = useState(false)
  const [daily, setDaily] = useState({ claimable: false, streak: 0 })
  const [inviteOpen, setInviteOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)

  const displayName = telegramUser?.first_name || 'Player'

  // Load each game's high score for the card badges.
  useEffect(() => {
    let cancelled = false
    Promise.all(GAMES.map((g) => getHighScore(g.id, uid).then((s) => [g.id, s]))).then(
      (pairs) => {
        if (!cancelled) setBests(Object.fromEntries(pairs))
      },
    )
    return () => {
      cancelled = true
    }
  }, [uid])

  // Referrals: register referrer (first open) + settle qualification.
  useEffect(() => {
    if (uid) syncReferral(getStartParam())
  }, [uid])

  // Daily spin: check status; auto-open once per day if available.
  useEffect(() => {
    let cancelled = false
    getDailyStatus(uid).then((status) => {
      if (cancelled) return
      setDaily(status)
      const seenKey = 'tapzy_daily_seen'
      const today = new Date().toISOString().slice(0, 10)
      if (status.claimable && sessionStorage.getItem(seenKey) !== today) {
        sessionStorage.setItem(seenKey, today)
        setDailyOpen(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [uid])

  return (
    <div className="launcher">
      <header className="launcher-header">
        <button
          className="launcher-profile-btn"
          onClick={() => {
            hapticImpact('light')
            setProfileOpen(true)
          }}
        >
          {telegramUser?.photo_url ? (
            <img className="avatar avatar--sm" src={telegramUser.photo_url} alt="" />
          ) : (
            <div className="avatar avatar--sm avatar--placeholder" aria-hidden="true">
              {displayName.charAt(0)}
            </div>
          )}
          <div className="launcher-greeting">
            <div className="launcher-hi">Hi, {displayName} 👋</div>
            <div className="launcher-sub">View profile</div>
          </div>
        </button>
        <CoinChip onClick={() => setWalletOpen(true)} />
        <SoundToggle />
      </header>

      <div className="game-grid">
        {GAMES.map((game, i) => (
          <button
            key={game.id}
            className="game-card"
            style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => {
              hapticImpact('light')
              onSelect(game)
            }}
          >
            <span className="game-card-icon">{game.icon}</span>
            <span className="game-card-title">{game.title}</span>
            <span className="game-card-best">
              {game.scoreLabel}: {bests[game.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="launcher-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            hapticImpact('light')
            setDailyOpen(true)
          }}
        >
          🎁 Daily Spin{daily.claimable ? ' — ready!' : ` · 🔥${daily.streak}`}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            hapticImpact('light')
            onOpenLeaderboard()
          }}
        >
          🏆 Leaderboard
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            hapticImpact('light')
            setInviteOpen(true)
          }}
        >
          🤝 Invite & earn
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            hapticImpact('light')
            setStoreOpen(true)
          }}
        >
          🛍️ Store
        </button>
      </div>

      <p className="launcher-footer">More games coming soon 🎮</p>

      {walletOpen ? <WalletModal onClose={() => setWalletOpen(false)} /> : null}
      {dailyOpen ? (
        <DailyModal
          streak={daily.streak}
          onClaimed={(streak) => setDaily({ claimable: false, streak })}
          onClose={() => {
            setDailyOpen(false)
            getDailyStatus(uid).then(setDaily)
          }}
        />
      ) : null}
      {inviteOpen ? <InviteModal onClose={() => setInviteOpen(false)} /> : null}
      {profileOpen ? <ProfileModal onClose={() => setProfileOpen(false)} /> : null}
      {storeOpen ? <StoreModal onClose={() => setStoreOpen(false)} /> : null}
    </div>
  )
}
