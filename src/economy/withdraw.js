import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseConfig'

// Must match server config (display + client-side guard; server re-checks).
export const WITHDRAW_MIN = 10000
export const COIN_USD = 0.0001

export async function requestWithdrawal({ coins, method, details, agreed }) {
  if (!auth?.currentUser) return { ok: false, reason: 'no_auth' }
  try {
    const idToken = await auth.currentUser.getIdToken()
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const res = await fetch('/api/withdraw/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, coins, method, details, agreed, nonce }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, reason: data.error || `http_${res.status}`, ...data }
    return { ok: true, ...data }
  } catch {
    return { ok: false, reason: 'network' }
  }
}

export function watchWithdrawals(uid, cb) {
  if (!db || !uid) {
    cb([])
    return () => {}
  }
  const q = query(collection(db, 'withdrawals'), where('uid', '==', uid))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      cb(rows)
    },
    () => cb([]),
  )
}
