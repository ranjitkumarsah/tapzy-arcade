import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getRecentLedger } from '../economy/wallet'
import { adsEnabled, showRewarded } from '../ads/monetag'

const LABELS = {
  ad_reward: '▶️ Ad reward',
  'perk:continue': '🔄 Continue',
  daily: '📅 Daily bonus',
  referral: '🤝 Referral',
}

function labelFor(entry) {
  return LABELS[entry.type] || entry.type
}

export default function WalletModal({ onClose }) {
  const { uid, wallet } = useApp()
  const [ledger, setLedger] = useState(null)
  const [earning, setEarning] = useState(false)

  useEffect(() => {
    getRecentLedger(uid, 15).then(setLedger)
  }, [uid])

  async function handleEarn() {
    setEarning(true)
    await showRewarded(uid ? uid.replace('tg_', '') : undefined)
    // Coins are credited by the server postback; the balance chip updates live.
    setEarning(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wallet-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🪙 Wallet</h2>

        <div className="wallet-balances">
          <div className="wallet-bal">
            <div className="wallet-bal-num">{wallet.earnedCoins}</div>
            <div className="wallet-bal-label">Withdrawable</div>
          </div>
          <div className="wallet-bal">
            <div className="wallet-bal-num">{wallet.bonusCoins}</div>
            <div className="wallet-bal-label">Bonus</div>
          </div>
        </div>

        <p className="wallet-hint">
          Earn withdrawable coins by watching ads. Bonus coins are for in-app perks.
        </p>

        {adsEnabled ? (
          <button className="btn btn-reward" onClick={handleEarn} disabled={earning}>
            {earning ? 'Loading ad…' : '▶️ Watch ad to earn coins'}
          </button>
        ) : null}

        <div className="wallet-ledger">
          <div className="wallet-ledger-title">Recent activity</div>
          {ledger === null ? (
            <div className="loading">Loading…</div>
          ) : ledger.length === 0 ? (
            <div className="lb-empty">No activity yet.</div>
          ) : (
            <ul className="wallet-ledger-list">
              {ledger.map((e) => (
                <li key={e.id}>
                  <span>{labelFor(e)}</span>
                  <span className={e.amount >= 0 ? 'amt-pos' : 'amt-neg'}>
                    {e.amount >= 0 ? '+' : ''}
                    {e.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
