import { useEffect, useRef, useState } from 'react'

// Player is X, a simple AI is O. Score: win 100, draw 50, loss 0.
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

// Return an index the given player should take to win, if any.
function findWinningMove(board, player) {
  for (const [a, b, c] of LINES) {
    const line = [board[a], board[b], board[c]]
    const idxs = [a, b, c]
    const marks = line.filter((v) => v === player).length
    const empties = line.filter((v) => v === null).length
    if (marks === 2 && empties === 1) {
      return idxs[line.indexOf(null)]
    }
  }
  return null
}

function aiMove(board) {
  // 1) win, 2) block, 3) center, 4) a corner, 5) any
  const win = findWinningMove(board, 'O')
  if (win !== null) return win
  const block = findWinningMove(board, 'X')
  if (block !== null) return block
  if (board[4] === null) return 4
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null)
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)]
  const empties = board.map((v, i) => (v === null ? i : null)).filter((i) => i !== null)
  return empties[Math.floor(Math.random() * empties.length)]
}

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
