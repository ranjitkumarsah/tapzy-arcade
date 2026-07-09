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

const CODE_VERSION = 'v4-multivariant'

// Reuse the Admin app across warm invocations.
function getAdminAuth() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getAuth()
}

// --- data-check-string builders -------------------------------------------
// Telegram signs the DECODED values, sorted by key, joined by \n, excluding
// `hash` (and, on newer clients, `signature`). The disagreement between clients
// and libraries is almost always in how the value is decoded, so we try several.

const DECODERS = {
  // strict RFC 3986 — does NOT turn '+' into space (matches Node querystring)
  uriComponent: (v) => {
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  },
  // form semantics — '+' becomes space (matches URLSearchParams). This was the
  // previous implementation and is the prime suspect.
  formUrlencoded: (v) => {
    try {
      return decodeURIComponent(v.replace(/\+/g, '%20'))
    } catch {
      return v
    }
  },
  // no decoding at all — use the raw percent-encoded value
  raw: (v) => v,
}

function parseRawPairs(initData) {
  return initData.split('&').map((kv) => {
    const i = kv.indexOf('=')
    return i === -1 ? [kv, ''] : [kv.slice(0, i), kv.slice(i + 1)]
  })
}

function buildDataCheckString(pairs, { excludeSignature, decode }) {
  return pairs
    .filter(([k]) => k !== 'hash' && (!excludeSignature || k !== 'signature'))
    .map(([k, v]) => [k, decode(v)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
}

function computeHash(dataCheckString, botToken) {
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
}

// The variants we attempt, in order of likelihood.
const VARIANTS = [
  { name: 'uriComponent_exclSig', decode: DECODERS.uriComponent, excludeSignature: true },
  { name: 'uriComponent_inclSig', decode: DECODERS.uriComponent, excludeSignature: false },
  { name: 'form_exclSig', decode: DECODERS.formUrlencoded, excludeSignature: true },
  { name: 'form_inclSig', decode: DECODERS.formUrlencoded, excludeSignature: false },
  { name: 'raw_exclSig', decode: DECODERS.raw, excludeSignature: true },
  { name: 'raw_inclSig', decode: DECODERS.raw, excludeSignature: false },
]

function verifyInitData(initData, botToken) {
  const pairs = parseRawPairs(initData)
  const providedHash = pairs.find(([k]) => k === 'hash')?.[1]
  if (!providedHash) return { ok: false, reason: 'missing_hash' }

  const attempts = []
  let matched = null

  for (const variant of VARIANTS) {
    const dcs = buildDataCheckString(pairs, variant)
    const computed = computeHash(dcs, botToken)
    const isMatch = computed.length === providedHash.length && computed === providedHash
    attempts.push({ variant: variant.name, prefix: computed.slice(0, 6), match: isMatch })
    if (isMatch && !matched) matched = variant
  }

  if (!matched) {
    return {
      ok: false,
      reason: 'bad_hash',
      diag: {
        fieldKeys: pairs.map(([k]) => k).sort(),
        providedPrefix: providedHash.slice(0, 6),
        botTokenLen: botToken.length,
        botTokenTail: botToken.slice(-4),
        attempts,
        // The exact string being signed (uriComponent, excl. signature).
        // Contains only your own Telegram user info + timestamps — never the token.
        dcsSample: buildDataCheckString(pairs, {
          excludeSignature: true,
          decode: DECODERS.uriComponent,
        }),
      },
    }
  }

  // Replay protection: reject data older than 24h.
  const authDate = Number(pairs.find(([k]) => k === 'auth_date')?.[1])
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (!authDate || nowSeconds - authDate > 86400) {
    return { ok: false, reason: 'expired' }
  }

  let user
  try {
    const userRaw = pairs.find(([k]) => k === 'user')?.[1] || '%7B%7D'
    user = JSON.parse(decodeURIComponent(userRaw))
  } catch {
    return { ok: false, reason: 'bad_user' }
  }
  if (!user?.id) return { ok: false, reason: 'no_user_id' }

  return { ok: true, user, method: matched.name }
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
      return res.status(401).json({
        error: 'invalid_init_data',
        reason: result.reason,
        codeVersion: CODE_VERSION,
        diag: result.diag || null,
      })
    }

    const uid = `tg_${result.user.id}`
    const token = await getAdminAuth().createCustomToken(uid, {
      telegramId: result.user.id,
    })

    return res.status(200).json({
      token,
      method: result.method, // which construction matched (for our records)
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
