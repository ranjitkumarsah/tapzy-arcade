// Server-authoritative economy primitives. ALL coin balance changes go through
// here so they are atomic, idempotent, and double-entry logged. Clients never
// write money collections (enforced by Firestore rules); only the Admin SDK does.
//
// Two-balance model:
//   earnedCoins  — from verified ad watches; WITHDRAWABLE (real money)
//   bonusCoins   — from daily/referral/etc; spendable in-app only
import { FieldValue } from 'firebase-admin/firestore'
import { getDb } from './firebaseAdmin.js'
import { config } from './config.js'

const walletRef = (db, uid) => db.doc(`wallets/${uid}`)
const ledgerRef = (db, uid, key) => db.doc(`ledger/${uid}/entries/${key}`)
const poolRef = (db) => db.doc('rewardPool/global')

// Credit coins to a user. Idempotent by `key` (same key never credits twice).
// `bucket` = 'earned' | 'bonus'. `drawFromPool` gates earned credits by the
// reward pool when enforcement is on.
export async function creditCoins({
  uid,
  amount,
  type,
  key,
  meta = {},
  bucket = 'earned',
  drawFromPool = false,
}) {
  if (!uid || !(amount > 0) || !key) throw new Error('bad_credit_args')
  const db = getDb()

  return db.runTransaction(async (tx) => {
    const lRef = ledgerRef(db, uid, key)
    const led = await tx.get(lRef)
    if (led.exists) return { duplicate: true }

    if (drawFromPool && config.poolEnforced) {
      const pRef = poolRef(db)
      const pool = await tx.get(pRef)
      const balance = pool.exists ? pool.data().poolBalance || 0 : 0
      if (balance < amount) return { insufficientPool: true }
      tx.set(
        pRef,
        {
          poolBalance: FieldValue.increment(-amount),
          paidToDate: FieldValue.increment(amount),
        },
        { merge: true },
      )
    }

    const field = bucket === 'earned' ? 'earnedCoins' : 'bonusCoins'
    const walletPatch = {
      [field]: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (bucket === 'earned') walletPatch.lifetimeEarned = FieldValue.increment(amount)

    tx.set(walletRef(db, uid), walletPatch, { merge: true })
    tx.set(lRef, {
      type,
      amount,
      bucket,
      meta,
      createdAt: FieldValue.serverTimestamp(),
    })
    return { credited: amount, bucket }
  })
}

// Spend coins atomically (bonus first, then earned). Idempotent by `key`.
export async function spendCoins({ uid, amount, type, key, meta = {} }) {
  if (!uid || !(amount > 0) || !key) throw new Error('bad_spend_args')
  const db = getDb()

  return db.runTransaction(async (tx) => {
    const lRef = ledgerRef(db, uid, key)
    const led = await tx.get(lRef)
    if (led.exists) return { duplicate: true }

    const wRef = walletRef(db, uid)
    const w = await tx.get(wRef)
    const bonus = w.exists ? w.data().bonusCoins || 0 : 0
    const earned = w.exists ? w.data().earnedCoins || 0 : 0
    if (bonus + earned < amount) return { insufficient: true }

    const fromBonus = Math.min(bonus, amount)
    const fromEarned = amount - fromBonus

    tx.set(
      wRef,
      {
        bonusCoins: FieldValue.increment(-fromBonus),
        earnedCoins: FieldValue.increment(-fromEarned),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    tx.set(lRef, {
      type,
      amount: -amount,
      fromBonus,
      fromEarned,
      meta,
      createdAt: FieldValue.serverTimestamp(),
    })
    return { spent: amount, fromBonus, fromEarned }
  })
}
