import { describe, it, expect } from 'vitest'
import { slide, operate, canMove } from './logic'

describe('2048 slide', () => {
  it('merges a pair and pads with zeros', () => {
    expect(slide([2, 2, 0, 0])).toEqual({ line: [4, 0, 0, 0], gained: 4 })
  })
  it('merges only once per slide (no chaining)', () => {
    expect(slide([2, 2, 2, 2])).toEqual({ line: [4, 4, 0, 0], gained: 8 })
  })
  it('does not merge unequal neighbours', () => {
    expect(slide([2, 4, 0, 0])).toEqual({ line: [2, 4, 0, 0], gained: 0 })
  })
})

describe('2048 operate', () => {
  const board = [
    [2, 2, 4, 0],
    [0, 0, 0, 0],
    [2, 0, 2, 0],
    [4, 4, 4, 4],
  ]
  it('moves left with correct merges + score', () => {
    const { board: b, gained } = operate(board, 'left')
    expect(b[0]).toEqual([4, 4, 0, 0])
    expect(b[2]).toEqual([4, 0, 0, 0])
    expect(b[3]).toEqual([8, 8, 0, 0])
    expect(gained).toBe(24)
  })
  it('moves right mirrors the result', () => {
    const { board: b } = operate(board, 'right')
    expect(b[0]).toEqual([0, 0, 4, 4])
    expect(b[3]).toEqual([0, 0, 8, 8])
  })
})

describe('2048 canMove', () => {
  it('true when an empty cell exists', () => {
    expect(canMove([[2, 4, 2, 0], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]])).toBe(true)
  })
  it('true when a merge is possible even with no empties', () => {
    expect(canMove([[2, 2, 4, 8], [4, 8, 16, 32], [2, 4, 8, 16], [32, 64, 128, 256]])).toBe(true)
  })
  it('false on a fully locked board', () => {
    expect(canMove([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]])).toBe(false)
  })
})
