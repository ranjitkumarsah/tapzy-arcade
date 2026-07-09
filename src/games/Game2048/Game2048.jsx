import { useCallback, useEffect, useRef, useState } from 'react'
import { useSwipe } from '../useSwipe'

const SIZE = 4

const empty = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function spawn(board) {
  const cells = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) cells.push([r, c])
  if (!cells.length) return board
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  board[r][c] = Math.random() < 0.9 ? 2 : 4
  return board
}

// Slide+merge a single line to the left. Returns { line, gained }.
function slide(line) {
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

function operate(board, dir) {
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

function canMove(board) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true
    }
  return false
}

export default function Game2048({ onGameOver }) {
  const [board, setBoard] = useState(() => spawn(spawn(empty())))
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const endedRef = useRef(false)

  const handleMove = useCallback(
    (dir) => {
      if (endedRef.current) return
      setBoard((prev) => {
        const { board: moved, gained } = operate(prev, dir)
        if (equal(moved, prev)) return prev
        spawn(moved)
        if (gained) {
          scoreRef.current += gained
          setScore(scoreRef.current)
        }
        if (!canMove(moved)) {
          endedRef.current = true
          const finalScore = scoreRef.current
          setTimeout(() => onGameOver(finalScore), 350)
        }
        return moved
      })
    },
    [onGameOver],
  )

  const swipe = useSwipe(handleMove)

  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      }
      if (map[e.key]) {
        e.preventDefault()
        handleMove(map[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  return (
    <div className="g2048">
      <div className="g2048-score">Score: {score}</div>
      <div className="g2048-board" {...swipe}>
        {board.flat().map((v, i) => (
          <div key={i} className={`g2048-tile tile-${v}`}>
            {v !== 0 ? v : ''}
          </div>
        ))}
      </div>
      <div className="g2048-hint">Swipe to move tiles</div>
    </div>
  )
}
