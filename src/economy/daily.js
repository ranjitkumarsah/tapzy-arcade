import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseConfig'

// Wheel segments — must match the server's WHEEL order.
export const WHEEL = [10, 15, 20, 25, 50, 100]

const todayYMD = () => new Date().toISOString().slice(0, 10).replace(/-/g, '')

// Read-only status for deciding whether to show the daily spin.
export async function getDailyStatus(uid) {
  if (!db || !uid) return { claimable: false, streak: 0, longest: 0 }
  try {
    const snap = await getDoc(doc(db, 'streaks', uid))
    const s = snap.exists() ? snap.data() : {}
    return {
      claimable: s.lastClaimDate !== todayYMD(),
      streak: s.current || 0,
      longest: s.longest || 0,
    }
  } catch {
    return { claimable: false, streak: 0, longest: 0 }
  }
}

export async function claimDaily() {
  if (!auth?.currentUser) return { ok: false, reason: 'no_auth' }
  try {
    const idToken = await auth.currentUser.getIdToken()
    const res = await fetch('/api/claimDaily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, reason: data.error || `http_${res.status}` }
    return { ok: true, ...data }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
