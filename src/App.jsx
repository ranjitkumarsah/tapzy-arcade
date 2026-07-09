import { useEffect, useState } from 'react'

// Phase 0 "Hello World": confirms the app renders and that the Telegram
// WebApp SDK is present when opened inside Telegram. Real Telegram wiring
// (ready/expand/theme/user) lands in Phase 1.
export default function App() {
  const [tg, setTg] = useState(null)

  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (webApp) {
      // Minimal handshake so Telegram stops showing the loading spinner.
      webApp.ready()
      setTg(webApp)
    }
  }, [])

  const insideTelegram = Boolean(tg)

  return (
    <main className="hello">
      <h1>Tapzy Arcade</h1>
      <p className="tagline">Hello World 👋</p>

      <div className={`status ${insideTelegram ? 'ok' : 'warn'}`}>
        {insideTelegram
          ? `✅ Telegram WebApp detected (v${tg.version || '?'})`
          : '⚠️ Not running inside Telegram (open via your bot to test).'}
      </div>

      <p className="hint">
        Phase 0 skeleton. Next: Phase 1 wires up real Telegram integration.
      </p>
    </main>
  )
}
