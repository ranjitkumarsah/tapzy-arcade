import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getShareLink, shareApp, hapticImpact } from '../telegram/initTelegram'
import { getReferralStats } from '../economy/referral'
import { APP_NAME } from '../appConfig'

export default function InviteModal({ onClose }) {
  const { uid } = useApp()
  const numeric = uid ? uid.replace('tg_', '') : undefined
  const link = getShareLink(numeric)
  const [stats, setStats] = useState({ invited: 0, qualified: 0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getReferralStats(uid).then(setStats)
  }, [uid])

  function copyLink() {
    hapticImpact('light')
    navigator.clipboard
      ?.writeText(link)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal invite-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🤝 Invite Friends</h2>
        <p className="wallet-hint">
          Share your link. Your friend gets bonus coins, and you earn coins once
          they play a few games!
        </p>

        <div className="invite-link">{link}</div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={copyLink}>
            {copied ? '✓ Copied!' : '📋 Copy link'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => shareApp({ ref: numeric, text: `Play free mini games on ${APP_NAME} and grab bonus coins! 🎮🪙` })}
          >
            📣 Share on Telegram
          </button>
        </div>

        <div className="invite-stats">
          <div className="wallet-bal">
            <div className="wallet-bal-num">{stats.invited}</div>
            <div className="wallet-bal-label">Invited</div>
          </div>
          <div className="wallet-bal">
            <div className="wallet-bal-num">{stats.qualified}</div>
            <div className="wallet-bal-label">Rewarded</div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
