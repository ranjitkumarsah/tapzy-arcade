// Vercel Serverless Function — server-to-server (S2S) reward postback.
//
// The ad network calls this URL when a user finishes a rewarded ad. We verify a
// shared secret, enforce a per-user daily cap, then credit WITHDRAWABLE coins
// idempotently by the ad event id. The client can NOT credit itself — this is
// the only path that grants earned (withdrawable) coins.
//
// SETUP (confirm exact param names with your ad network — V2-P0 gate):
//   Postback URL: https://<your-vercel>/api/adReward?secret=<AD_POSTBACK_SECRET>
//     &uid={ymid}&event_id={reqid}&reward={reward}
//   The client passes its Telegram user id as the ad "ymid"/sub-id so the
//   network echoes it back here. Env: AD_POSTBACK_SECRET.
import { FieldValue } from 'firebase-admin/firestore'
import { getDb } from '../server/firebaseAdmin.js'
import { config } from '../server/config.js'
import { creditCoins } from '../server/economy.js'

const pick = (...vals) => vals.find((v) => v != null && v !== '')

export default async function handler(req, res) {
  const q = { ...req.query, ...(typeof req.body === 'object' ? req.body : {}) }

  // Log every hit so you can confirm (in Vercel → Functions logs) whether
  // Monetag actually calls the postback, and with which params.
  console.log('adReward hit:', {
    method: req.method,
    keys: Object.keys(q),
    uid: q.uid ?? q.ymid ?? q.user_id ?? null,
    event: q.event_id ?? q.reqid ?? q.transaction_id ?? null,
    reward: q.reward ?? q.value ?? null,
    hasSecret: Boolean(q.secret || req.headers['x-postback-secret']),
  })

  // 1) verify shared secret
  const secret = process.env.AD_POSTBACK_SECRET
  const provided = pick(q.secret, req.headers['x-postback-secret'])
  if (!secret || provided !== secret) {
    res.statusCode = 403
    return res.end('forbidden')
  }

  // 2) extract params (support common alias names across networks)
  const rawUid = pick(q.uid, q.ymid, q.user_id, q.sub_id, q.subid, q.telegram_id)
  const eventId = pick(
    q.event_id,
    q.transaction_id,
    q.click_id,
    q.reqid,
    q.requestvar,
    q.request_var,
    q.impression_id,
    q.var,
  )
  const reward = Number(pick(q.reward, q.value, q.payout, q.estimated_price, 0)) || 0
  if (!rawUid || !eventId) {
    res.statusCode = 400
    return res.end('missing_params')
  }
  const uid = String(rawUid).startsWith('tg_') ? String(rawUid) : `tg_${rawUid}`

  try {
    const db = getDb()

    // 3) per-user daily cap (anti-farming)
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const capRef = db.doc(`adCounters/${uid}_${day}`)
    const underCap = await db.runTransaction(async (tx) => {
      const c = await tx.get(capRef)
      const n = c.exists ? c.data().count || 0 : 0
      if (n >= config.dailyAdRewardCap) return false
      tx.set(
        capRef,
        { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      return true
    })
    if (!underCap) {
      res.statusCode = 200 // 200 so the network doesn't keep retrying
      return res.end('cap_reached')
    }

    // 4) coins for this watch: from revenue×split when provided, else fallback
    const amount =
      reward > 0
        ? Math.max(1, Math.round((reward * config.poolSplit) / config.coinValueUsd))
        : config.coinsPerAd

    // 5) credit (idempotent by event id; draws from the reward pool)
    const result = await creditCoins({
      uid,
      amount,
      type: 'ad_reward',
      key: `ad_${eventId}`,
      meta: { eventId, reward },
      bucket: 'earned',
      drawFromPool: true,
    })

    res.statusCode = 200
    return res.end(result.duplicate ? 'duplicate' : result.insufficientPool ? 'pool_empty' : 'ok')
  } catch (err) {
    console.error('adReward error:', err)
    res.statusCode = 500
    return res.end('error')
  }
}
