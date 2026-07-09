import { auth } from '../firebase/firebaseConfig'

// Spend coins on a perk. Authenticated with the user's Firebase ID token; the
// server verifies it and enforces the real cost. Returns { ok, ...result }.
export async function spendPerk(perk, meta = {}) {
  if (!auth?.currentUser) return { ok: false, reason: 'no_auth' }
  try {
    const idToken = await auth.currentUser.getIdToken()
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const res = await fetch('/api/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, perk, nonce, meta }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, reason: data.error || `http_${res.status}` }
    if (data.insufficient) return { ok: false, reason: 'insufficient' }
    return { ok: true, ...data }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
