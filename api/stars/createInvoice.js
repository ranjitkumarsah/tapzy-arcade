// Vercel Serverless Function — create a Telegram Stars invoice link.
//
// Auth via Firebase ID token. Builds the invoice from the SERVER product catalog
// (client can't set the price) and returns a link the client opens with
// Telegram.WebApp.openInvoice(). Payment is confirmed later by the webhook.
import { getAuth } from 'firebase-admin/auth'
import { getDb } from '../../server/firebaseAdmin.js'
import { STARS_PRODUCTS } from '../../server/products.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  try {
    const { idToken, productId } = req.body || {}
    const product = STARS_PRODUCTS[productId]
    if (!idToken || !product) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'bad_request' }))
    }

    getDb()
    const decoded = await getAuth().verifyIdToken(idToken)
    const uid = decoded.uid
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim()

    const body = {
      title: product.title,
      description: product.description,
      payload: `${productId}:${uid}`, // recovered in the webhook
      provider_token: '', // empty for Telegram Stars
      currency: 'XTR',
      prices: [{ label: product.title, amount: product.stars }],
    }

    const r = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    if (!data.ok) {
      console.error('createInvoiceLink failed:', data)
      res.statusCode = 502
      return res.end(JSON.stringify({ error: 'invoice_failed' }))
    }

    res.statusCode = 200
    return res.end(JSON.stringify({ link: data.result }))
  } catch (err) {
    console.error('createInvoice error:', err)
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'server_error' }))
  }
}
