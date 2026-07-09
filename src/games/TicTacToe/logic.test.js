import { describe, it, expect } from 'vitest'
import { winner, findWinningMove, aiMove } from './logic'

const _ = null

describe('tic-tac-toe winner', () => {
  it('detects a row win', () => {
    expect(winner(['X', 'X', 'X', _, _, _, _, _, _])).toBe('X')
  })
  it('detects a diagonal win', () => {
    expect(winner(['O', _, _, _, 'O', _, _, _, 'O'])).toBe('O')
  })
  it('returns null with no winner', () => {
    expect(winner(['X', 'O', 'X', _, _, _, _, _, _])).toBe(null)
  })
})

describe('tic-tac-toe AI', () => {
  it('takes the winning move when available', () => {
    // O at 0,1 -> should complete at 2
    expect(findWinningMove(['O', 'O', _, _, _, _, _, _, _], 'O')).toBe(2)
  })
  it('blocks the player from winning', () => {
    // X threatens 0,1 -> AI must block at 2
    expect(aiMove(['X', 'X', _, _, _, _, _, _, _])).toBe(2)
  })
  it('prefers center on an empty board', () => {
    expect(aiMove(Array(9).fill(_))).toBe(4)
  })
})
