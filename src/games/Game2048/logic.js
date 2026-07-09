// Pure 2048 logic — no React, so it's easy to unit-test.
export const SIZE = 4

export const empty = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
export const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export function spawn(board) {
  const cells = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) cells.push([r, c])
  if (!cells.length) return board
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  board[r][c] = Math.random() < 0.9 ? 2 : 4
  return board
}

// Slide+merge a single line to the left. Returns { line, gained }.
export function slide(line) {
  const arr = line.filter((v) => v !== 0)
  let gained = 0
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2
      gained += arr[i]
      arr.splice(i + 1, 1)
    }
  }
  while (arr.length < SIZE) arr.push(0)
  return { line: arr, gained }
}

export function operate(board, dir) {
  const next = empty()
  let gained = 0
  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < SIZE; r++) {
      let row = board[r]
      if (dir === 'right') row = [...row].reverse()
      const res = slide(row)
      gained += res.gained
      next[r] = dir === 'right' ? res.line.reverse() : res.line
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      let col = board.map((row) => row[c])
      if (dir === 'down') col.reverse()
      const res = slide(col)
      gained += res.gained
      const out = dir === 'down' ? res.line.reverse() : res.line
      for (let r = 0; r < SIZE; r++) next[r][c] = out[r]
    }
  }
  return { board: next, gained }
}

export function canMove(board) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true
    }
  return false
}
