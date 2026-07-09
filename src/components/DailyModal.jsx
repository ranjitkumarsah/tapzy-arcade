import { useState } from 'react'
import { WHEEL, claimDaily } from '../economy/daily'
import { hapticNotify, hapticImpact } from '../telegram/initTelegram'

const SEG = 360 / WHEEL.length
const COLORS = ['#5eb5f7', '#3aa76d', '#edc850', '#ec6b56', '#9b7ede', '#f2994a']

// Build the conic-gradient background for the wheel.
const wheelBg = `conic-gradient(${WHEEL.map(
  (_, i) => `${COLORS[i % COLORS.length]} ${i * SEG}deg ${(i + 1) * SEG}deg`,
).join(', ')})`

export default function DailyModal({ streak, onClose }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)

  async function spin() {
    if (spinning || result) return
    setSpinning(true)
    hapticImpact('medium')
    const r = await claimDaily()

    if (!r.ok) {
      setResult({ error: true })
      setSpinning(false)
      return
    }
    if (r.alreadyClaimed) {
      setResult({ already: true, streak: r.streak })
      setSpinning(false)
      return
    }

    // Land segment r.wheelIndex under the top pointer, after several spins.
    const target = 360 * 5 - (r.wheelIndex * SEG + SEG / 2)
    setRotation(target)
    setTimeout(() => {
      hapticNotify('success')
      setResult({
        reward: r.reward,
        wheelReward: r.wheelReward,
        streakBonus: r.streakBonus,
        streak: r.streak,
      })
      setSpinning(false)
    }, 3600)
  }

  return (
    <div className="modal-backdrop" onClick={result ? onClose : undefined}>
      <div className="modal daily-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎁 Daily Spin</h2>
        <div className="daily-streak">🔥 {Math.max(streak, result?.streak || 0)}-day streak</div>

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
          <div className="daily-hint">Spin once a day. Longer streak = bigger bonus!</div>
        )}

        {!result ? (
          <button className="btn btn-primary" onClick={spin} disabled={spinning}>
            {spinning ? 'Spinning…' : '🎡 Spin'}
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
