import { useEffect, useRef, useState } from 'react'
import { winner, aiMove } from './logic'

// Player is X, a simple AI is O. Score: win 100, draw 50, loss 0.
export default function TicTacToe({ onGameOver }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState('X') // 'X' = player, 'O' = AI
  const endedRef = useRef(false)

  const win = winner(board)
  const full = board.every(Boolean)
  const done = Boolean(win) || full

  // End detection — fire onGameOver exactly once. Using a ref (not effect deps)
  // avoids the effect re-running and cancelling its own timeout.
  useEffect(() => {
    if (endedRef.current) return
    if (win || full) {
      endedRef.current = true
      const score = win === 'X' ? 100 : win === 'O' ? 0 : 50
      const t = setTimeout(() => onGameOver(score), 800)
      return () => clearTimeout(t)
    }
  }, [win, full, onGameOver])

  // AI plays when it's O's turn.
  useEffect(() => {
    if (done || turn !== 'O') return
    const t = setTimeout(() => {
      setBoard((prev) => {
        if (winner(prev) || prev.every(Boolean)) return prev
        const next = [...prev]
        next[aiMove(prev)] = 'O'
        return next
      })
      setTurn('X')
    }, 400)
    return () => clearTimeout(t)
  }, [turn, done])

  function handleClick(i) {
    if (done || board[i] || turn !== 'X') return
    const next = [...board]
    next[i] = 'X'
    setBoard(next)
    setTurn('O')
  }

  const status = win
    ? win === 'X'
      ? 'You win! 🎉'
      : 'AI wins 🤖'
    : full
      ? "It's a draw 🤝"
      : turn === 'X'
        ? 'Your turn (X)'
        : 'AI thinking…'

  return (
    <div className="ttt">
      <div className="ttt-status">{status}</div>
      <div className="ttt-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell ? `ttt-${cell.toLowerCase()}` : ''}`}
            onClick={() => handleClick(i)}
            disabled={Boolean(cell) || done || turn !== 'X'}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  )
}
