import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebaseConfig'

// Public per-game leaderboard: leaderboard/{gameId}/entries/{uid}.
// One entry per user (their best). We only write when they beat their own best,
// which keeps Firestore writes low (free-tier friendly).

export async function submitLeaderboardScore(gameId, score, displayName, uid) {
  if (!db || !uid) return
  const safe = Number.isFinite(score) ? Math.round(score) : 0
  try {
    await setDoc(doc(db, 'leaderboard', gameId, 'entries', uid), {
      uid,
      displayName: displayName || 'Player',
      score: safe,
      updatedAt: serverTimestamp(),
    })
  } catch {
    /* leaderboard is non-critical — never break the game-over flow */
  }
}

export async function getTopScores(gameId, n = 50) {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'leaderboard', gameId, 'entries'),
      orderBy('score', 'desc'),
      limit(n),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}

// Rank within the top N (cheap). Returns a number, or null if outside the top N.
export async function getMyRank(gameId, uid, n = 50) {
  if (!db || !uid) return null
  const top = await getTopScores(gameId, n)
  const idx = top.findIndex((e) => (e.id || e.uid) === uid)
  return idx === -1 ? null : idx + 1
}
