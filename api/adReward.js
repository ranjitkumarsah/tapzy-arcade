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
    ymid: q.ymid ?? q.uid ?? null,
    paid: q.paid ?? q.reward_event_type ?? null,
    price: q.estimated_price ?? q.reward ?? null,
    hasSecret: Boolean(q.secret || req.headers['x-postback-secret']),
  })

  // 1) verify shared secret
  const secret = process.env.AD_POSTBACK_SECRET
  const provided = pick(q.secret, req.headers['x-postback-secret'])
  if (!secret || provided !== secret) {
    res.statusCode = 403
    return res.end('forbidden')
  }

  // 2) Monetag sends YMID = the "<userId>__<nonce>" we packed on the client.
  // Recover the user id from the first segment; use the whole YMID as the
  // unique event id (idempotency key). Also accept plain aliases for the curl
  // test path.
  const ymid = pick(q.ymid, q.uid, q.user_id, q.sub_id, q.subid)
  if (!ymid) {
    res.statusCode = 400
    return res.end('missing_ymid')
  }
  const rawUid = String(ymid).split('__')[0]
  const eventId = pick(q.event_id, q.transaction_id, String(ymid)) // full ymid = unique
  const uid = rawUid.startsWith('tg_') ? rawUid : `tg_${rawUid}`

  // Only paid impressions fund withdrawable coins. Monetag "reward event type"
  // is "yes" when paid. If the flag is absent (e.g. curl test), we don't block.
  const paid = pick(q.paid, q.reward_event_type)
  if (paid === 'no') {
    res.statusCode = 200
    return res.end('unpaid') // impression not monetized -> no coins
  }
  const reward = Number(pick(q.reward, q.value, q.payout, q.estimated_price, 0)) || 0

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
