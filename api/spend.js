// Vercel Serverless Function — spend coins on a perk.
//
// Authenticated by the caller's Firebase ID token (verified server-side), so a
// user can only spend from their own wallet. Atomic + idempotent via a client
// nonce. The perk cost is read from the SERVER catalog, never trusted from the
// client.
import { getAuth } from 'firebase-admin/auth'
import { getDb } from '../server/firebaseAdmin.js'
import { spendCoins } from '../server/economy.js'
import { PERKS } from '../server/products.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  try {
    const { idToken, perk, nonce, meta } = req.body || {}
    if (!idToken || !perk || !nonce) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'missing_params' }))
    }

    const product = PERKS[perk]
    if (!product) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'unknown_perk' }))
    }

    getDb() // ensures the Admin app is initialized before getAuth()
    const decoded = await getAuth().verifyIdToken(idToken)
    const uid = decoded.uid

    const result = await spendCoins({
      uid,
      amount: product.cost,
      type: `perk:${perk}`,
      key: `spend_${uid}_${nonce}`,
      meta: { perk, ...(meta || {}) },
    })

    res.statusCode = 200
    return res.end(JSON.stringify(result))
  } catch (err) {
    console.error('spend error:', err)
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'server_error' }))
  }
}
