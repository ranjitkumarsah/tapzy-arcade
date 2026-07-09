import { useState } from 'react'
import { isMuted, toggleMuted } from '../sound/sound'

// Small mute/unmute button. Reflects the persisted setting.
export default function SoundToggle() {
  const [muted, setMuted] = useState(isMuted())
  return (
    <button
      className="sound-toggle"
      aria-label={muted ? 'Unmute' : 'Mute'}
      onClick={() => setMuted(toggleMuted())}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
