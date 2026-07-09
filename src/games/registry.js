import { lazy } from 'react'

// Central game registry. Each game is lazy-loaded so the launcher's initial
// bundle stays small (games' code loads only when opened).
//
// Every game component receives a single prop: onGameOver(score:number).
// GameShell handles the rest (score saving, game-over modal, back navigation).
export const GAMES = [
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    icon: '⭕',
    scoreLabel: 'Best',
    component: lazy(() => import('./TicTacToe/TicTacToe.jsx')),
  },
  {
    id: 'memory',
    title: 'Memory Match',
    icon: '🧠',
    scoreLabel: 'Best',
    component: lazy(() => import('./MemoryMatch/MemoryMatch.jsx')),
  },
  {
    id: 'quiz',
    title: 'Quiz',
    icon: '❓',
    scoreLabel: 'Best',
    component: lazy(() => import('./Quiz/Quiz.jsx')),
  },
  {
    id: '2048',
    title: '2048',
    icon: '🔢',
    scoreLabel: 'Best',
    component: lazy(() => import('./Game2048/Game2048.jsx')),
  },
  {
    id: 'snake',
    title: 'Snake',
    icon: '🐍',
    scoreLabel: 'Best',
    component: lazy(() => import('./Snake/Snake.jsx')),
  },
  {
    id: 'flappy',
    title: 'Flappy',
    icon: '🐤',
    scoreLabel: 'Best',
    component: lazy(() => import('./FlappyClone/FlappyClone.jsx')),
  },
]

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null
}
