// Vercel Serverless Function — referrals (server-authoritative, bonus coins).
//
// Two steps, both idempotent:
//   1) Register: first open with a valid ref link stores referredBy ONCE and
//      credits the invitee an instant signup bonus.
//   2) Qualify: once the invitee has played enough games, credit the referrer
//      (anti-throwaway). Called on each launcher load so it settles when ready.
//
// Self-referral and double-referral are blocked. Rewards are BONUS coins.
import { FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getDb } from '../server/firebaseAdmin.js'
import { creditCoins } from '../server/economy.js'
import { config } from '../server/config.js'

async function gamesPlayed(db, uid) {
  try {
    const snap = await db.collection(`scores/${uid}/games`).get()
    let n = 0
    snap.forEach((d) => {
      n += d.data().playCount || 0
    })
    return n
  } catch {
    return 0
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  try {
    const { idToken, startParam } = req.body || {}
    if (!idToken) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'missing_token' }))
    }

    getDb()
    const decoded = await getAuth().verifyIdToken(idToken)
    const uid = decoded.uid // invitee
    const myNumeric = uid.replace('tg_', '')
    const db = getDb()
    const refRef = db.doc(`referrals/${uid}`)
    let refDoc = await refRef.get()

    // 1) Registration — only once, with a valid, non-self ref param.
    if (
      !refDoc.exists &&
      typeof startParam === 'string' &&
      startParam.startsWith('ref_')
    ) {
      const refNumeric = startParam.slice(4)
      if (refNumeric && refNumeric !== myNumeric) {
        const referrerUid = `tg_${refNumeric}`
        await refRef.set(
          {
            referredBy: referrerUid,
            referredAt: FieldValue.serverTimestamp(),
            inviteeCredited: false,
            referrerCredited: false,
          },
          { merge: true },
        )
        await creditCoins({
          uid,
          amount: config.referralInviteeBonus,
          type: 'referral',
          key: `ref_invitee_${uid}`,
          bucket: 'bonus',
          meta: { referrerUid },
        })
        await refRef.set({ inviteeCredited: true }, { merge: true })
        refDoc = await refRef.get()
      }
    }

    // 2) Qualification — credit the referrer once the invitee has played enough.
    const data = refDoc.exists ? refDoc.data() : null
    let referrerCredited = data?.referrerCredited || false
    if (data?.referredBy && !referrerCredited) {
      const played = await gamesPlayed(db, uid)
      if (played >= config.referralQualifyGames) {
        await creditCoins({
          uid: data.referredBy,
          amount: config.referralReferrerReward,
          type: 'referral',
          key: `ref_referrer_${uid}`,
          bucket: 'bonus',
          meta: { invitee: uid },
        })
        await refRef.set(
          { referrerCredited: true, qualifiedAt: FieldValue.serverTimestamp() },
          { merge: true },
        )
        referrerCredited = true
      }
    }

    res.statusCode = 200
    return res.end(
      JSON.stringify({
        ok: true,
        referredBy: data?.referredBy || null,
        inviteeCredited: data?.inviteeCredited || false,
        referrerCredited,
      }),
    )
  } catch (err) {
    console.error('referral error:', err)
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'server_error' }))
  }
}
