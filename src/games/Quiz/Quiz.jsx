import { useEffect, useMemo, useState } from 'react'
import QUESTIONS from './questions.json'
import { playBlip } from '../../sound/sound'

const ROUND_SIZE = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick ROUND_SIZE questions and pre-shuffle each question's options.
function buildRound() {
  return shuffle(QUESTIONS)
    .slice(0, ROUND_SIZE)
    .map((q) => {
      const options = shuffle(
        q.options.map((text, i) => ({ text, correct: i === q.answer })),
      )
      return { question: q.question, category: q.category, options }
    })
}

export default function Quiz({ onGameOver }) {
  const round = useMemo(buildRound, [])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null) // index of chosen option, or null

  const current = round[index]
  const total = round.length

  // Advance after a short reveal; end the game after the last question.
  useEffect(() => {
    if (picked === null) return
    const gained = current.options[picked].correct ? 1 : 0
    playBlip(gained === 1)
    const t = setTimeout(() => {
      const nextScore = score + gained
      if (index + 1 >= total) {
        onGameOver(nextScore) // score = number correct
      } else {
        setScore(nextScore)
        setIndex((i) => i + 1)
        setPicked(null)
      }
    }, 750)
    return () => clearTimeout(t)
  }, [picked])

  return (
    <div className="quiz">
      <div className="quiz-progress">
        <span>
          Q{index + 1}/{total}
        </span>
        <span className="quiz-cat">{current.category}</span>
        <span>Score: {score}</span>
      </div>

      <div className="quiz-question">{current.question}</div>

      <div className="quiz-options">
        {current.options.map((opt, i) => {
          let cls = 'quiz-option'
          if (picked !== null) {
            if (opt.correct) cls += ' is-correct'
            else if (i === picked) cls += ' is-wrong'
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => picked === null && setPicked(i)}
              disabled={picked !== null}
            >
              {opt.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
