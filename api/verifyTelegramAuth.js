// Vercel Serverless Function (free Hobby tier — no card required).
//
// Verifies a Telegram Mini App `initData` string and, if valid, mints a Firebase
// custom auth token for UID `tg_<telegram_user_id>`. This is the only server-side
// piece of the app; everything else is static + Firebase client SDK.
//
// Required env vars (set in the Vercel dashboard, NOT VITE_-prefixed):
//   TELEGRAM_BOT_TOKEN        — from BotFather
//   FIREBASE_SERVICE_ACCOUNT  — the full service-account JSON (as a string)

import crypto from 'node:crypto'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Reuse the Admin app across warm invocations.
function getAdminAuth() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getAuth()
}

// Telegram's verification spec:
//   secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
//   check_hash = HMAC_SHA256(key=secret_key, msg=data_check_string)
// where data_check_string is the sorted "key=value" lines (excluding `hash`).
function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData)
  const providedHash = params.get('hash')
  if (!providedHash) return { ok: false, reason: 'missing_hash' }
  // Both `hash` and the newer Ed25519 `signature` field must be excluded from
  // the data-check-string (Telegram computes the HMAC over everything else).
  params.delete('hash')
  params.delete('signature')

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const a = Buffer.from(computedHash, 'hex')
  const b = Buffer.from(providedHash, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_hash' }
  }

  // Replay protection: reject data older than 24h.
  const authDate = Number(params.get('auth_date'))
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (!authDate || nowSeconds - authDate > 86400) {
    return { ok: false, reason: 'expired' }
  }

  let user
  try {
    user = JSON.parse(params.get('user') || '{}')
  } catch {
    return { ok: false, reason: 'bad_user' }
  }
  if (!user?.id) return { ok: false, reason: 'no_user_id' }

  return { ok: true, user }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    // Trim to survive an accidental trailing space/newline pasted into Vercel.
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
    if (!botToken || !process.env.FIREBASE_SERVICE_ACCOUNT) {
      return res.status(500).json({ error: 'server_not_configured' })
    }

    const initData = req.body?.initData
    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ error: 'missing_init_data' })
    }

    const result = verifyInitData(initData, botToken)
    if (!result.ok) {
      return res.status(401).json({ error: 'invalid_init_data', reason: result.reason })
    }

    const uid = `tg_${result.user.id}`
    const token = await getAdminAuth().createCustomToken(uid, {
      telegramId: result.user.id,
    })

    return res.status(200).json({
      token,
      user: {
        id: result.user.id,
        first_name: result.user.first_name || '',
        last_name: result.user.last_name || '',
        username: result.user.username || '',
        photo_url: result.user.photo_url || '',
      },
    })
  } catch (err) {
    console.error('verifyTelegramAuth error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
