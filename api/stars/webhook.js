// Vercel Serverless Function — Telegram bot webhook for Stars payments.
//
// Handles the two payment updates:
//   pre_checkout_query  -> must be answered OK within 10s or the payment fails
//   successful_payment  -> grant the entitlement/coins (idempotent by charge id)
// All other updates are ignored. Verified by a secret token header.
import { FieldValue } from 'firebase-admin/firestore'
import { getDb } from '../../server/firebaseAdmin.js'
import { creditCoins } from '../../server/economy.js'
import { STARS_PRODUCTS } from '../../server/products.js'

const botToken = () => process.env.TELEGRAM_BOT_TOKEN?.trim()

function tg(method, body) {
  return fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function grant(uid, productId, chargeId, sp) {
  const product = STARS_PRODUCTS[productId]
  if (!product || !chargeId) return
  const db = getDb()
  const purchaseRef = db.doc(`purchases/${chargeId}`)

  // Idempotency: mark the charge as processed once.
  const fresh = await db.runTransaction(async (tx) => {
    const p = await tx.get(purchaseRef)
    if (p.exists) return false
    tx.set(purchaseRef, {
      uid,
      productId,
      chargeId,
      stars: sp.total_amount,
      at: FieldValue.serverTimestamp(),
    })
    return true
  })
  if (!fresh) return

  if (product.type === 'entitlement' && product.grant === 'noAds') {
    await db.doc(`profiles/${uid}`).set({ entitlements: { noAds: true } }, { merge: true })
  } else if (product.type === 'theme') {
    await db
      .doc(`profiles/${uid}`)
      .set({ entitlements: { themes: FieldValue.arrayUnion(product.grant) } }, { merge: true })
  } else if (product.type === 'coins') {
    await creditCoins({
      uid,
      amount: product.amount,
      type: 'stars_coins',
      key: `stars_${chargeId}`,
      bucket: 'bonus',
      meta: { productId, chargeId },
    })
  }
}

export default async function handler(req, res) {
  const secret = process.env.STARS_WEBHOOK_SECRET
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    res.statusCode = 403
    return res.end('forbidden')
  }

  const update = req.body || {}
  try {
    if (update.pre_checkout_query) {
      await tg('answerPreCheckoutQuery', {
        pre_checkout_query_id: update.pre_checkout_query.id,
        ok: true,
      })
      res.statusCode = 200
      return res.end('ok')
    }

    const sp = update.message?.successful_payment
    if (sp) {
      const uid = `tg_${update.message.from.id}`
      const [productId] = String(sp.invoice_payload || '').split(':')
      await grant(uid, productId, sp.telegram_payment_charge_id, sp)
      res.statusCode = 200
      return res.end('ok')
    }

    res.statusCode = 200
    return res.end('ignored')
  } catch (err) {
    console.error('stars webhook error:', err)
    res.statusCode = 200 // 200 so Telegram doesn't retry-storm
    return res.end('err')
  }
}
