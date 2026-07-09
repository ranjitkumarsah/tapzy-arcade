// Vercel Serverless Function — daily spin reward (server-authoritative).
//
// One claim per server-day. The SERVER rolls the wheel (never the client),
// applies a streak bonus, and credits BONUS coins (in-app only — daily rewards
// don't inflate the withdrawable pool). Idempotent per calendar day.
import { FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getDb } from '../server/firebaseAdmin.js'
import { creditCoins } from '../server/economy.js'

// Wheel segments (must match the client's WHEEL order) + pick weights.
const WHEEL = [1, 2, 3, 5, 8, 15]
const WEIGHTS = [30, 25, 20, 15, 7, 3]

function pickIndex() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i]
    if (r < 0) return i
  }
  return 0
}

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '')

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  try {
    const { idToken } = req.body || {}
    if (!idToken) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'missing_token' }))
    }

    getDb()
    const decoded = await getAuth().verifyIdToken(idToken)
    const uid = decoded.uid
    const db = getDb()

    const now = new Date()
    const today = ymd(now)
    const yesterday = ymd(new Date(now.getTime() - 86400000))

    const sRef = db.doc(`streaks/${uid}`)
    const snap = await sRef.get()
    const s = snap.exists ? snap.data() : {}

    if (s.lastClaimDate === today) {
      res.statusCode = 200
      return res.end(
        JSON.stringify({
          alreadyClaimed: true,
          streak: s.current || 0,
          longest: s.longest || 0,
        }),
      )
    }

    const streak = s.lastClaimDate === yesterday ? (s.current || 0) + 1 : 1
    const wheelIndex = pickIndex()
    const streakBonus = Math.min(streak - 1, 10) // small: +1/day up to +10
    const reward = WHEEL[wheelIndex] + streakBonus

    await creditCoins({
      uid,
      amount: reward,
      type: 'daily',
      key: `daily_${uid}_${today}`,
      bucket: 'bonus',
      meta: { wheelIndex, streak },
    })

    await sRef.set(
      {
        current: streak,
        longest: Math.max(s.longest || 0, streak),
        lastClaimDate: today,
        lastClaimAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    res.statusCode = 200
    return res.end(
      JSON.stringify({
        claimed: true,
        reward,
        wheelReward: WHEEL[wheelIndex],
        streakBonus,
        wheelIndex,
        streak,
        longest: Math.max(s.longest || 0, streak),
      }),
    )
  } catch (err) {
    console.error('claimDaily error:', err)
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'server_error' }))
  }
}
