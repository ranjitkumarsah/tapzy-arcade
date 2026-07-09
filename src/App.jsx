import { useApp } from './context/AppContext'

// Phase 1: shows the real Telegram user, adopts Telegram's theme, and confirms
// the SDK handshake. The launcher + games arrive in Phase 3.
export default function App() {
  const { insideTelegram, telegramUser } = useApp()

  const displayName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ')
    : '…'

  return (
    <main className="hello">
      <h1>Tapzy Arcade</h1>

      {telegramUser?.photo_url ? (
        <img className="avatar" src={telegramUser.photo_url} alt="" />
      ) : (
        <div className="avatar avatar--placeholder" aria-hidden="true">
          {displayName.charAt(0) || '?'}
        </div>
      )}

      <p className="tagline">
        Welcome, <strong>{displayName}</strong> 👋
        {telegramUser?.username ? (
          <span className="handle"> @{telegramUser.username}</span>
        ) : null}
      </p>

      <div className={`status ${insideTelegram ? 'ok' : 'warn'}`}>
        {insideTelegram
          ? '✅ Running inside Telegram — theme synced, view expanded.'
          : '⚠️ Not running inside Telegram (showing a mock user for local dev).'}
      </div>

      <p className="hint">Phase 1 complete. Next: Phase 2 wires Firebase auth.</p>
    </main>
  )
}
