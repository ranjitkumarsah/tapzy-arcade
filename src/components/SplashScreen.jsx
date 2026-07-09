import { useState } from 'react'
import { APP_NAME, APP_TAGLINE } from '../appConfig'

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
            alt={APP_NAME}
            onError={() => setIdx((i) => i + 1)}
          />
        ) : (
          <div className="splash-logo splash-logo--fallback" aria-hidden="true">
            {APP_NAME.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="splash-title">{APP_NAME}</div>
        <div className="splash-sub">{APP_TAGLINE}</div>
        <div className="splash-bar">
          <span />
        </div>
      </div>
    </div>
  )
}
