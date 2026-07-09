import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { STORE_PRODUCTS } from '../economy/storeProducts'
import { buyProduct } from '../economy/stars'
import { currentPremiumTheme, setPremiumTheme } from '../theme/premium'

export default function StoreModal({ onClose }) {
  const { entitlements } = useApp()
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)
  const [theme, setTheme] = useState(currentPremiumTheme())

  function owns(p) {
    if (p.type === 'entitlement') return entitlements.noAds
    if (p.type === 'theme') return entitlements.themes?.includes(p.grant)
    return false
  }

  async function buy(id) {
    setBusy(id)
    setMsg(null)
    const r = await buyProduct(id)
    setBusy(null)
    setMsg(
      r.ok
        ? '✅ Purchase complete!'
        : r.status === 'cancelled'
          ? 'Cancelled.'
          : 'Purchase failed.',
    )
  }

  function toggleTheme(grant) {
    const next = theme === grant ? null : grant
    setPremiumTheme(next)
    setTheme(next)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal store-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🛍️ Store</h2>
        <p className="wallet-hint">Pay with Telegram Stars ⭐</p>

        <div className="store-list">
          {STORE_PRODUCTS.map((p) => {
            const owned = owns(p)
            return (
              <div key={p.id} className="store-item">
                <span className="store-icon">{p.icon}</span>
                <div className="store-info">
                  <div className="store-title">{p.title}</div>
                  <div className="store-desc">{p.desc}</div>
                </div>
                {owned && p.type === 'theme' ? (
                  <button className="btn btn-secondary store-btn" onClick={() => toggleTheme(p.grant)}>
                    {theme === p.grant ? 'On' : 'Off'}
                  </button>
                ) : owned ? (
                  <span className="store-owned">Owned</span>
                ) : (
                  <button
                    className="btn btn-primary store-btn"
                    onClick={() => buy(p.id)}
                    disabled={busy === p.id}
                  >
                    {busy === p.id ? '…' : `⭐ ${p.stars}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {msg ? <div className="ad-msg">{msg}</div> : null}
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
