// Pure Tic-Tac-Toe logic — no React, easy to unit-test.
export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

// Return an index the given player should take to win/complete a line, if any.
export function findWinningMove(board, player) {
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

export function aiMove(board) {
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
