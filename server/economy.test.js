import { describe, it, expect, beforeEach, vi } from 'vitest'

// In-memory Firestore transaction mock.
const store = new Map()
const tx = {
  async get(ref) {
    const d = store.get(ref.path)
    return { exists: d !== undefined, data: () => d }
  },
  set(ref, patch, opts) {
    const cur = opts?.merge ? { ...(store.get(ref.path) || {}) } : {}
    for (const [k, v] of Object.entries(patch)) {
      if (v && v.__inc !== undefined) cur[k] = (cur[k] || 0) + v.__inc
      else if (v && v.__ts) cur[k] = 'TS'
      else cur[k] = v
    }
    store.set(ref.path, cur)
  },
}
const fakeDb = {
  doc: (path) => ({ path }),
  runTransaction: async (fn) => fn(tx),
}

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (n) => ({ __inc: n }),
    serverTimestamp: () => ({ __ts: true }),
  },
}))
vi.mock('./firebaseAdmin.js', () => ({ getDb: () => fakeDb }))

const { creditCoins, spendCoins } = await import('./economy.js')

beforeEach(() => store.clear())

describe('creditCoins', () => {
  it('credits earned coins + lifetime + ledger', async () => {
    const r = await creditCoins({ uid: 'tg_1', amount: 10, type: 'ad_reward', key: 'e1' })
    expect(r).toEqual({ credited: 10, bucket: 'earned' })
    expect(store.get('wallets/tg_1').earnedCoins).toBe(10)
    expect(store.get('wallets/tg_1').lifetimeEarned).toBe(10)
    expect(store.get('ledger/tg_1/entries/e1')).toBeTruthy()
  })

  it('is idempotent by key (no double credit)', async () => {
    await creditCoins({ uid: 'tg_1', amount: 10, type: 'ad_reward', key: 'e1' })
    const dup = await creditCoins({ uid: 'tg_1', amount: 10, type: 'ad_reward', key: 'e1' })
    expect(dup).toEqual({ duplicate: true })
    expect(store.get('wallets/tg_1').earnedCoins).toBe(10) // unchanged
  })

  it('routes bonus coins to the bonus bucket (no lifetimeEarned)', async () => {
    await creditCoins({ uid: 'tg_2', amount: 5, type: 'daily', key: 'd1', bucket: 'bonus' })
    expect(store.get('wallets/tg_2').bonusCoins).toBe(5)
    expect(store.get('wallets/tg_2').lifetimeEarned).toBeUndefined()
  })
})

describe('spendCoins', () => {
  it('spends bonus first, then earned', async () => {
    await creditCoins({ uid: 'tg_3', amount: 10, type: 'ad', key: 'a', bucket: 'earned' })
    await creditCoins({ uid: 'tg_3', amount: 4, type: 'daily', key: 'b', bucket: 'bonus' })
    const r = await spendCoins({ uid: 'tg_3', amount: 6, type: 'continue', key: 's1' })
    expect(r).toEqual({ spent: 6, fromBonus: 4, fromEarned: 2 })
    expect(store.get('wallets/tg_3').bonusCoins).toBe(0)
    expect(store.get('wallets/tg_3').earnedCoins).toBe(8)
  })

  it('rejects spending more than the balance', async () => {
    await creditCoins({ uid: 'tg_4', amount: 3, type: 'ad', key: 'a', bucket: 'earned' })
    const r = await spendCoins({ uid: 'tg_4', amount: 10, type: 'continue', key: 's1' })
    expect(r).toEqual({ insufficient: true })
    expect(store.get('wallets/tg_4').earnedCoins).toBe(3) // unchanged
  })

  it('is idempotent by key', async () => {
    await creditCoins({ uid: 'tg_5', amount: 10, type: 'ad', key: 'a', bucket: 'earned' })
    await spendCoins({ uid: 'tg_5', amount: 4, type: 'continue', key: 's1' })
    const dup = await spendCoins({ uid: 'tg_5', amount: 4, type: 'continue', key: 's1' })
    expect(dup).toEqual({ duplicate: true })
    expect(store.get('wallets/tg_5').earnedCoins).toBe(6) // only spent once
  })
})
