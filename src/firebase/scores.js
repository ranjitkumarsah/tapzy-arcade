import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'

// High-score storage.
//   - When authenticated (inside Telegram): Firestore at scores/{uid}/games/{gameId}.
//   - Otherwise (local dev / no Firebase): localStorage fallback so games still work.
//
// saveScore returns { best, isRecord } so the game-over UI can celebrate a new best.

const lsKey = (gameId) => `tapzy_highscore_${gameId}`

function readLocal(gameId) {
  const v = localStorage.getItem(lsKey(gameId))
  return v ? Number(v) : 0
}

export async function getHighScore(gameId, uid) {
  if (!db || !uid) return readLocal(gameId)
  try {
    const snap = await getDoc(doc(db, 'scores', uid, 'games', gameId))
    return snap.exists() ? snap.data().highScore || 0 : 0
  } catch {
    return readLocal(gameId)
  }
}

export async function saveScore(gameId, score, uid) {
  const safeScore = Number.isFinite(score) ? Math.round(score) : 0

  if (!db || !uid) {
    const prev = readLocal(gameId)
    const best = Math.max(prev, safeScore)
    localStorage.setItem(lsKey(gameId), String(best))
    return { best, isRecord: safeScore > prev }
  }

  try {
    const ref = doc(db, 'scores', uid, 'games', gameId)
    const snap = await getDoc(ref)
    const prev = snap.exists() ? snap.data().highScore || 0 : 0
    const isRecord = safeScore > prev
    await setDoc(
      ref,
      {
        highScore: isRecord ? safeScore : prev,
        lastPlayedAt: serverTimestamp(),
        playCount: increment(1),
      },
      { merge: true },
    )
    return { best: Math.max(prev, safeScore), isRecord }
  } catch {
    // Never let a failed write crash the game-over flow.
    const prev = readLocal(gameId)
    const best = Math.max(prev, safeScore)
    localStorage.setItem(lsKey(gameId), String(best))
    return { best, isRecord: safeScore > prev }
  }
}
