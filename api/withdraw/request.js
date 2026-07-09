// Vercel Serverless Function — request a withdrawal (manual-approval mode).
//
// Debits ONLY earnedCoins (withdrawable, from verified ad watches), atomically
// holding them, and creates a `pending` withdrawal for the owner to review. No
// money moves here. Idempotent by client nonce; one pending request at a time.
import { FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getDb } from '../../server/firebaseAdmin.js'
import { config } from '../../server/config.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  try {
    const { idToken, coins, method, details, nonce, agreed } = req.body || {}
    if (!idToken || !nonce) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'missing_params' }))
    }
    if (!agreed) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'terms_required' }))
    }
    const amount = Math.floor(Number(coins))
    if (!Number.isFinite(amount) || amount < config.withdrawMinCoins) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'below_min', min: config.withdrawMinCoins }))
    }
    if (amount > config.withdrawMaxPerRequest) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'above_max', max: config.withdrawMaxPerRequest }))
    }
    if (!method || !details) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'missing_payout_details' }))
    }

    getDb()
    const decoded = await getAuth().verifyIdToken(idToken)
    const uid = decoded.uid
    const db = getDb()

    // One pending request at a time (single-field query — no composite index).
    const mine = await db.collection('withdrawals').where('uid', '==', uid).get()
    if (mine.docs.some((d) => d.data().status === 'pending')) {
      res.statusCode = 409
      return res.end(JSON.stringify({ error: 'already_pending' }))
    }

    const wRef = db.doc(`wallets/${uid}`)
    const ledgerRef = db.doc(`ledger/${uid}/entries/withdraw_${nonce}`)
    const wdRef = db.doc(`withdrawals/${uid}_${nonce}`)

    const result = await db.runTransaction(async (tx) => {
      const led = await tx.get(ledgerRef)
      if (led.exists) return { duplicate: true }
      const w = await tx.get(wRef)
      const earned = w.exists ? w.data().earnedCoins || 0 : 0
      if (earned < amount) return { insufficient: true, earned }

      tx.set(
        wRef,
        { earnedCoins: FieldValue.increment(-amount), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      tx.set(ledgerRef, {
        type: 'withdraw_hold',
        amount: -amount,
        meta: { method },
        createdAt: FieldValue.serverTimestamp(),
      })
      tx.set(wdRef, {
        uid,
        coins: amount,
        valueUsd: +(amount * config.coinValueUsd).toFixed(4),
        method,
        details,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      })
      return { ok: true }
    })

    if (result.duplicate) return res.end(JSON.stringify({ ok: true, duplicate: true }))
    if (result.insufficient) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'insufficient', earned: result.earned }))
    }
    res.statusCode = 200
    return res.end(JSON.stringify({ ok: true }))
  } catch (err) {
    console.error('withdraw request error:', err)
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'server_error' }))
  }
}
