// Vercel Serverless Function — owner-only withdrawal review.
//
// Gated by ADMIN_SECRET (header x-admin-secret or body.secret). Actions:
//   approve -> mark approved (ready to pay out via your chosen rail)
//   paid    -> mark paid (record txRef after you send the money)
//   reject  -> refund the held earnedCoins (clawback) and mark rejected
//
// You run this manually (curl) after verifying a request. No auto-payout.
import { FieldValue } from 'firebase-admin/firestore'
import { getDb } from '../../server/firebaseAdmin.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const secret = process.env.ADMIN_SECRET
  const provided =
    req.headers['x-admin-secret'] || req.body?.secret || req.query?.secret
  if (!secret || provided !== secret) {
    res.statusCode = 403
    return res.end(JSON.stringify({ error: 'forbidden' }))
  }
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  try {
    const { id, action, note, txRef } = req.body || {}
    if (!id || !action) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'missing_params' }))
    }
    const db = getDb()
    const wdRef = db.doc(`withdrawals/${id}`)

    const out = await db.runTransaction(async (tx) => {
      const wd = await tx.get(wdRef)
      if (!wd.exists) return { error: 'not_found' }
      const d = wd.data()

      if (action === 'approve') {
        if (d.status !== 'pending') return { error: 'bad_state' }
        tx.set(wdRef, { status: 'approved', reviewedAt: FieldValue.serverTimestamp(), note: note || '' }, { merge: true })
        return { ok: true, status: 'approved' }
      }
      if (action === 'paid') {
        if (!['approved', 'pending'].includes(d.status)) return { error: 'bad_state' }
        tx.set(wdRef, { status: 'paid', paidAt: FieldValue.serverTimestamp(), txRef: txRef || '', note: note || '' }, { merge: true })
        return { ok: true, status: 'paid' }
      }
      if (action === 'reject') {
        if (!['pending', 'approved'].includes(d.status)) return { error: 'bad_state' }
        // Clawback: return the held coins to the user's withdrawable balance.
        tx.set(db.doc(`wallets/${d.uid}`), { earnedCoins: FieldValue.increment(d.coins), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        tx.set(db.doc(`ledger/${d.uid}/entries/withdraw_refund_${id}`), { type: 'withdraw_refund', amount: d.coins, createdAt: FieldValue.serverTimestamp() })
        tx.set(wdRef, { status: 'rejected', reviewedAt: FieldValue.serverTimestamp(), note: note || '' }, { merge: true })
        return { ok: true, status: 'rejected' }
      }
      return { error: 'unknown_action' }
    })

    res.statusCode = out.ok ? 200 : 400
    return res.end(JSON.stringify(out))
  } catch (err) {
    console.error('withdraw admin error:', err)
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'server_error' }))
  }
}
