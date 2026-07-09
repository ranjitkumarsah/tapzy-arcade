import { useState } from 'react'

// Animated launch splash. Uses public/logo.png if present, otherwise a styled
// monogram. Shown while auth resolves (and for a short minimum so it doesn't
// flash by).
export default function SplashScreen() {
  const [imgOk, setImgOk] = useState(true)

  return (
    <div className="splash">
      <div className="splash-inner">
        {imgOk ? (
          <img
            src="/logo.png"
            className="splash-logo"
            alt="Tapzy Arcade"
            onError={() => setImgOk(false)}
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
