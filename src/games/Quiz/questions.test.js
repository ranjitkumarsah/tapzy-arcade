import { describe, it, expect } from 'vitest'
import questions from './questions.json'

describe('quiz question bank', () => {
  it('has a healthy number of questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(40)
  })

  it('every question is well-formed', () => {
    for (const q of questions) {
      expect(typeof q.question).toBe('string')
      expect(q.question.length).toBeGreaterThan(0)
      expect(Array.isArray(q.options)).toBe(true)
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4) // no duplicate options
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(4)
      expect(typeof q.category).toBe('string')
    }
  })

  it('covers both categories', () => {
    const cats = new Set(questions.map((q) => q.category))
    expect(cats.has('General Knowledge')).toBe(true)
    expect(cats.has('Science & Tech')).toBe(true)
  })
})
