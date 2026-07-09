import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WHEEL, claimDaily } from '../economy/daily'
import { adsEnabled, showRewarded } from '../ads/monetag'
import { hapticNotify, hapticImpact } from '../telegram/initTelegram'
import Confetti from './Confetti'

const SEG = 360 / WHEEL.length
const COLORS = ['#5eb5f7', '#3aa76d', '#edc850', '#ec6b56', '#9b7ede', '#f2994a']

const wheelBg = `conic-gradient(${WHEEL.map(
  (_, i) => `${COLORS[i % COLORS.length]} ${i * SEG}deg ${(i + 1) * SEG}deg`,
).join(', ')})`

export default function DailyModal({ streak, onClaimed, onClose }) {
  const { uid } = useApp()
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [msg, setMsg] = useState(null)

  async function spin() {
    if (spinning || result) return
    setSpinning(true)
    setMsg(null)
    hapticImpact('medium')

    // Watch a rewarded ad first (when ads are configured).
    if (adsEnabled) {
      setMsg('Loading ad…')
      const watched = await showRewarded(uid ? uid.replace('tg_', '') : undefined)
      if (!watched) {
        setMsg('Watch the full ad to claim your spin.')
        setSpinning(false)
        return
      }
      setMsg(null)
    }

    const r = await claimDaily()
    if (!r.ok) {
      setResult({ error: true })
      setSpinning(false)
      return
    }
    if (r.alreadyClaimed) {
      onClaimed?.(r.streak)
      setResult({ already: true, streak: r.streak })
      setSpinning(false)
      return
    }

    const target = 360 * 5 - (r.wheelIndex * SEG + SEG / 2)
    setRotation(target)
    setTimeout(() => {
      hapticNotify('success')
      onClaimed?.(r.streak)
      setResult({
        reward: r.reward,
        wheelReward: r.wheelReward,
        streakBonus: r.streakBonus,
        streak: r.streak,
      })
      setSpinning(false)
    }, 3600)
  }

  const shownStreak = Math.max(streak || 0, result?.streak || 0)

  return (
    <div className="modal-backdrop" onClick={result ? onClose : undefined}>
      {result?.reward != null ? <Confetti /> : null}
      <div className="modal daily-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎁 Daily Spin</h2>
        <div className="daily-streak">🔥 {shownStreak}-day streak</div>

        <div className="wheel-wrap">
          <div className="wheel-pointer">▼</div>
          <div
            className="wheel"
            style={{ background: wheelBg, transform: `rotate(${rotation}deg)` }}
          >
            {WHEEL.map((v, i) => (
              <span
                key={i}
                className="wheel-label"
                style={{ transform: `rotate(${i * SEG + SEG / 2}deg) translateY(-64px)` }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {result?.reward != null ? (
          <div className="daily-result">
            <div className="record-badge">+{result.reward} 🪙</div>
            <div className="best-line">
              Wheel {result.wheelReward} + streak {result.streakBonus}
            </div>
          </div>
        ) : result?.already ? (
          <div className="best-line">Already claimed — come back tomorrow! 👋</div>
        ) : result?.error ? (
          <div className="best-line">Couldn’t claim right now. Try again later.</div>
        ) : (
          <div className="daily-hint">
            {adsEnabled ? 'Watch a short ad to spin.' : 'Spin once a day.'} Longer
            streak = bigger bonus!
          </div>
        )}

        {msg ? <div className="ad-msg">{msg}</div> : null}

        {!result ? (
          <button className="btn btn-primary" onClick={spin} disabled={spinning}>
            {spinning ? 'Spinning…' : adsEnabled ? '▶️ Watch & Spin' : '🎡 Spin'}
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
