import { useCallback, useState } from 'react'
import { useApp } from './context/AppContext'
import Launcher from './components/Launcher'
import GameShell from './components/GameShell'
import Leaderboard from './components/Leaderboard'

export default function App() {
  const { authStatus } = useApp()
  const [view, setView] = useState('launcher') // 'launcher' | 'game' | 'leaderboard'
  const [activeGame, setActiveGame] = useState(null)
  const [lbGameId, setLbGameId] = useState(null)

  const openGame = useCallback((game) => {
    setActiveGame(game)
    setView('game')
  }, [])

  const backToLauncher = useCallback(() => {
    setActiveGame(null)
    setView('launcher')
  }, [])

  // Opened from the launcher (no id) or from a game's game-over modal (with id).
  const openLeaderboard = useCallback((gameId) => {
    setActiveGame(null)
    setLbGameId(typeof gameId === 'string' ? gameId : null)
    setView('leaderboard')
  }, [])

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
      {view === 'game' && activeGame ? (
        <GameShell
          game={activeGame}
          onExit={backToLauncher}
          onOpenLeaderboard={openLeaderboard}
        />
      ) : view === 'leaderboard' ? (
        <Leaderboard initialGameId={lbGameId} onExit={backToLauncher} />
      ) : (
        <Launcher onSelect={openGame} onOpenLeaderboard={openLeaderboard} />
      )}
    </main>
  )
}
