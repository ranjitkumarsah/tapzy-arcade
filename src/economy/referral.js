import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseConfig'

// Register the referrer (if any) and settle qualification. Safe to call on each
// launcher load — the server is idempotent.
export async function syncReferral(startParam) {
  if (!auth?.currentUser) return { ok: false }
  try {
    const idToken = await auth.currentUser.getIdToken()
    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, startParam: startParam || '' }),
    })
    return await res.json().catch(() => ({ ok: false }))
  } catch {
    return { ok: false }
  }
}

// Referrer stats: who I invited and how many qualified.
export async function getReferralStats(uid) {
  if (!db || !uid) return { invited: 0, qualified: 0 }
  try {
    const q = query(collection(db, 'referrals'), where('referredBy', '==', uid))
    const snap = await getDocs(q)
    let qualified = 0
    snap.forEach((d) => {
      if (d.data().referrerCredited) qualified += 1
    })
    return { invited: snap.size, qualified }
  } catch {
    return { invited: 0, qualified: 0 }
  }
}
