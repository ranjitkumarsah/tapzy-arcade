import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseConfig'

// Buy a Stars product: get an invoice link from the server, then open Telegram's
// native Stars checkout. Entitlements/coins are granted by the webhook and show
// up via the entitlements/wallet snapshots.
export async function buyProduct(productId) {
  if (!auth?.currentUser) return { ok: false, reason: 'no_auth' }
  try {
    const idToken = await auth.currentUser.getIdToken()
    const res = await fetch('/api/stars/createInvoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, productId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.link) return { ok: false, reason: data.error || 'invoice' }

    return await new Promise((resolve) => {
      const wa = window.Telegram?.WebApp
      if (wa?.openInvoice) {
        wa.openInvoice(data.link, (status) => resolve({ ok: status === 'paid', status }))
      } else {
        window.open(data.link, '_blank')
        resolve({ ok: false, status: 'external' })
      }
    })
  } catch {
    return { ok: false, reason: 'network' }
  }
}

// Live entitlements (server-written). { noAds, themes[] }.
export function watchEntitlements(uid, cb) {
  if (!db || !uid) {
    cb({ noAds: false, themes: [] })
    return () => {}
  }
  return onSnapshot(
    doc(db, 'profiles', uid),
    (snap) => {
      const e = (snap.exists() && snap.data().entitlements) || {}
      cb({ noAds: !!e.noAds, themes: e.themes || [] })
    },
    () => cb({ noAds: false, themes: [] }),
  )
}
