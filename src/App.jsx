import { useCallback, useState } from 'react'
import { useApp } from './context/AppContext'
import Launcher from './components/Launcher'
import GameShell from './components/GameShell'

export default function App() {
  const { authStatus } = useApp()
  const [activeGame, setActiveGame] = useState(null)

  const exitGame = useCallback(() => setActiveGame(null), [])

  // Brief loading state while Telegram auth resolves (skipped in dev mode).
  if (authStatus === 'loading') {
    return (
      <main className="app-loading">
        <div className="app-logo">Tapzy Arcade</div>
        <div className="loading">Loading…</div>
      </main>
    )
  }

  return (
    <main className="app">
      {activeGame ? (
        <GameShell game={activeGame} onExit={exitGame} />
      ) : (
        <Launcher onSelect={setActiveGame} />
      )}
    </main>
  )
}
