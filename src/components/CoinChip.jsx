import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useCountUp } from '../hooks/useCountUp'

// Compact coin balance shown in headers. Pulses when the balance increases.
export default function CoinChip({ onClick }) {
  const { wallet } = useApp()
  const shown = useCountUp(wallet.total, 500)
  const prev = useRef(wallet.total)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (wallet.total > prev.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 500)
      prev.current = wallet.total
      return () => clearTimeout(t)
    }
    prev.current = wallet.total
  }, [wallet.total])

  return (
    <button className={`coin-chip${bump ? ' bump' : ''}`} onClick={onClick} aria-label="Wallet">
      🪙 <span>{shown}</span>
    </button>
  )
}
