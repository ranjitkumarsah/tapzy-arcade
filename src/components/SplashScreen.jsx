import { useState } from 'react'

// Logo source priority: the bot's own profile photo (fetched server-side via
// /api/botPhoto) → a bundled public/logo.png → a styled monogram.
const SOURCES = ['/api/botPhoto', '/logo.png']

export default function SplashScreen() {
  const [idx, setIdx] = useState(0)
  const src = idx < SOURCES.length ? SOURCES[idx] : null

  return (
    <div className="splash">
      <div className="splash-inner">
        {src ? (
          <img
            key={src}
            src={src}
            className="splash-logo"
            alt="Tapzy Arcade"
            onError={() => setIdx((i) => i + 1)}
          />
        ) : (
          <div className="splash-logo splash-logo--fallback" aria-hidden="true">
            TA
          </div>
        )}
        <div className="splash-title">Tapzy Arcade</div>
        <div className="splash-sub">Tap · Play · Compete</div>
        <div className="splash-bar">
          <span />
        </div>
      </div>
    </div>
  )
}
