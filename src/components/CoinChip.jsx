import { useApp } from '../context/AppContext'

// Compact coin balance shown in headers. Tapping opens the wallet.
export default function CoinChip({ onClick }) {
  const { wallet } = useApp()
  return (
    <button className="coin-chip" onClick={onClick} aria-label="Wallet">
      🪙 <span>{wallet.total}</span>
    </button>
  )
}
