import { useCallback, useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import Launcher from './components/Launcher'
import GameShell from './components/GameShell'
import Leaderboard from './components/Leaderboard'
import ErrorBoundary from './components/ErrorBoundary'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const { authStatus } = useApp()
  const [view, setView] = useState('launcher') // 'launcher' | 'game' | 'leaderboard'
  const [activeGame, setActiveGame] = useState(null)
  const [lbGameId, setLbGameId] = useState(null)
  const [minSplashDone, setMinSplashDone] = useState(false)

  // Keep the splash up for a short minimum so it doesn't flash by.
  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1600)
    return () => clearTimeout(t)
  }, [])

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

  if (authStatus === 'loading' || !minSplashDone) {
    return <SplashScreen />
  }

  return (
    <main className="app">
      {view === 'game' && activeGame ? (
        <ErrorBoundary onReset={backToLauncher}>
          <GameShell
            game={activeGame}
            onExit={backToLauncher}
            onOpenLeaderboard={openLeaderboard}
          />
        </ErrorBoundary>
      ) : view === 'leaderboard' ? (
        <Leaderboard initialGameId={lbGameId} onExit={backToLauncher} />
      ) : (
        <Launcher onSelect={openGame} onOpenLeaderboard={openLeaderboard} />
      )}
    </main>
  )
}
