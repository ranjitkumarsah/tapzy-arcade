import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

// Client can only READ its wallet (Firestore rules forbid writes). Balances are
// changed server-side by the economy functions.
//   earnedCoins — withdrawable (from verified ad watches)
//   bonusCoins  — in-app only (daily/referral/etc)
export function watchWallet(uid, cb) {
  if (!db || !uid) {
    cb({ earnedCoins: 0, bonusCoins: 0 })
    return () => {}
  }
  return onSnapshot(
    doc(db, 'wallets', uid),
    (snap) => {
      const d = snap.exists() ? snap.data() : {}
      cb({
        earnedCoins: d.earnedCoins || 0,
        bonusCoins: d.bonusCoins || 0,
        total: (d.earnedCoins || 0) + (d.bonusCoins || 0),
      })
    },
    () => cb({ earnedCoins: 0, bonusCoins: 0, total: 0 }),
  )
}
