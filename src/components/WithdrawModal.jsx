import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { requestWithdrawal, watchWithdrawals, WITHDRAW_MIN, COIN_USD } from '../economy/withdraw'

const METHODS = [
  { id: 'usdt', label: 'USDT (crypto)', hint: 'Your wallet address' },
  { id: 'paypal', label: 'PayPal', hint: 'Your PayPal email' },
]

const ERRORS = {
  below_min: `Minimum is ${WITHDRAW_MIN.toLocaleString()} coins.`,
  above_max: 'Amount too large.',
  insufficient: 'Not enough withdrawable coins.',
  already_pending: 'You already have a pending request.',
  terms_required: 'Please accept the terms.',
  missing_payout_details: 'Enter your payout details.',
}

const STATUS_LABEL = {
  pending: '⏳ Pending review',
  approved: '✅ Approved',
  paid: '💸 Paid',
  rejected: '↩️ Rejected (refunded)',
}

export default function WithdrawModal({ onClose }) {
  const { uid, wallet } = useApp()
  const [amount, setAmount] = useState(WITHDRAW_MIN)
  const [method, setMethod] = useState('usdt')
  const [details, setDetails] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => watchWithdrawals(uid, setHistory), [uid])

  const withdrawable = wallet.earnedCoins
  const usd = (Number(amount) * COIN_USD).toFixed(2)
  const methodHint = METHODS.find((m) => m.id === method)?.hint

  async function submit() {
    setBusy(true)
    setMsg(null)
    const r = await requestWithdrawal({ coins: Number(amount), method, details, agreed })
    setBusy(false)
    if (r.ok) {
      setMsg('✅ Request submitted for review.')
      setDetails('')
      setAgreed(false)
    } else {
      setMsg(ERRORS[r.reason] || 'Request failed.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal withdraw-modal" onClick={(e) => e.stopPropagation()}>
        <h2>💸 Withdraw</h2>
        <div className="best-line">
          Withdrawable: <strong>{withdrawable.toLocaleString()}</strong> 🪙 (≈ ${(withdrawable * COIN_USD).toFixed(2)})
        </div>
        <p className="wallet-hint">
          Only coins earned from watching ads are withdrawable. Requests are
          reviewed manually before payout.
        </p>

        <label className="wd-label">Amount (coins)</label>
        <input
          className="wd-input"
          type="number"
          min={WITHDRAW_MIN}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="wd-est">≈ ${usd}</div>

        <label className="wd-label">Payout method</label>
        <select className="wd-input" value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <label className="wd-label">{methodHint}</label>
        <input
          className="wd-input"
          type="text"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={methodHint}
        />

        <label className="wd-terms">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I confirm the details are correct and accept that payouts are subject
            to review, eligibility, and anti-fraud checks.
          </span>
        </label>

        {msg ? <div className="ad-msg">{msg}</div> : null}

        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={busy || Number(amount) < WITHDRAW_MIN || withdrawable < Number(amount)}
        >
          {busy ? 'Submitting…' : 'Request withdrawal'}
        </button>

        {history.length ? (
          <>
            <div className="wallet-ledger-title">History</div>
            <ul className="wallet-ledger-list">
              {history.map((h) => (
                <li key={h.id}>
                  <span>
                    {h.coins?.toLocaleString()} 🪙 · {h.method}
                  </span>
                  <span>{STATUS_LABEL[h.status] || h.status}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
