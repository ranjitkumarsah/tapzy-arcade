import { useApp } from './context/AppContext'

// Phase 1: shows the real Telegram user, adopts Telegram's theme, and confirms
// the SDK handshake. The launcher + games arrive in Phase 3.
const AUTH_LABEL = {
  loading: '⏳ Signing you in…',
  authenticated: '🔐 Signed in to Firebase (scores will save)',
  dev: '🧪 Dev mode — Firebase auth skipped',
  error: '❌ Auth failed',
}

export default function App() {
  const { insideTelegram, telegramUser, authStatus, authError, authErrorDetail, uid } = useApp()

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

      <div className={`status ${authStatus === 'error' ? 'warn' : 'ok'}`}>
        {AUTH_LABEL[authStatus] || authStatus}
        {authStatus === 'authenticated' && uid ? (
          <div className="hint">uid: {uid}</div>
        ) : null}
        {authStatus === 'error' && authError ? (
          <div className="hint">{authError}</div>
        ) : null}
        {authStatus === 'error' && authErrorDetail ? (
          <pre className="debug">{JSON.stringify(authErrorDetail, null, 2)}</pre>
        ) : null}
      </div>

      <p className="hint">Phase 2: Firebase auth wired. Next: Phase 3 games.</p>
    </main>
  )
}
