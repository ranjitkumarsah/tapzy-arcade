import { useCallback, useEffect, useRef, useState } from 'react'
import { useSwipe } from '../useSwipe'
import { empty, equal, spawn, operate, canMove } from './logic'
import { playBlip } from '../../sound/sound'

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
          playBlip(true)
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
