# V2 Phase 0 — Economy Foundations & Ad-Policy Gate

**Goal:** Put the trustworthy plumbing in place for a real-money economy: confirm the ad model is allowed, then build a **server-authoritative wallet + ledger** and wire **verified ad-reward crediting** via Monetag's server-side postback (S2S).

**Depends on:** v1 complete.

---

## 🔒 Step 0 — Ad-policy gate (do this FIRST; it can change everything)

**🔧 MANUAL STEP — Verify the earning model is allowed.** Before writing economy code:
1. Check **Monetag's policy** on *incentivized traffic* and *paying users real cash for watching ads*. Read their publisher terms / ask their support directly: "Can I reward users with withdrawable cash for watching rewarded ads, and do you support server-side reward postbacks (S2S)?"
2. Confirm Monetag provides a **server-side reward callback (S2S postback)** with a **signature/secret** so the server can trust "this user completed this ad."
3. **If Monetag disallows cash incentives or has no S2S:** pick a **compliant network** for the *earning* source — an **offerwall / rewarded-cash** provider that explicitly permits paying users (these exist for Telegram Mini Apps). Ads for non-cash interstitials can stay Monetag.

> Decision output: which network credits withdrawable coins, and the exact S2S postback format (params + signature). Tell Claude the result — the `adReward.js` function is built to that spec.

---

## Tasks (Claude writes as code)

1. **Firestore schema + rules** (server-write-only for money):
   - `wallets/{uid}`, `ledger/{uid}/entries/{id}`, `rewardPool/global`.
   - Rules: clients may **read** their own `wallets`/`ledger`; **no client writes** to any money collection. All writes via Admin SDK.
2. **Shared server economy lib** (`api/_lib/economy.js`): `creditCoins(uid, amount, type, idempotencyKey, meta)` and `spendCoins(uid, amount, type, key, meta)` — both run in a Firestore **transaction**, write a **ledger** entry, update the cached `wallets.coins`, and are **idempotent** (skip if key already used).
3. **`api/adReward.js`** — the Monetag S2S postback endpoint:
   - Validates the request signature/secret from the ad network.
   - Extracts `uid` + a unique event id; enforces **per-user/day caps**.
   - Computes coins for the watch based on the **reward-pool rate** (see below), only if `rewardPool.poolBalance` allows.
   - Calls `creditCoins(...)` idempotently.
4. **Reward-pool accounting** (`rewardPool/global`): tracks `revenueToDate`, `poolBalance` (50% of net revenue), `paidToDate`. Crediting decrements available pool; never credit beyond it.
5. **Client wallet read** (`src/economy/wallet.js`): live-read `wallets/{uid}.coins` for the UI (no writes).
6. **Config** (`api/_lib/config.js`): coin↔value rate, per-day caps, pool split (50%). Server-side only.

---

## 🔧 Manual Steps

- **🔧 Ad-policy gate** (Step 0 above) — blocking.
- **🔧 Configure the S2S postback URL** in the ad network dashboard to point at `https://<your-vercel>/api/adReward` with the agreed secret. Add the secret to **Vercel env** (`AD_POSTBACK_SECRET`).
- **🔧 Set economy config** values (coin rate, daily caps) with Claude — start conservative.
- **🔧 Deploy Firestore rules** (console paste or `firebase deploy --only firestore:rules`).

---

## Acceptance criteria

- [ ] Ad-policy question answered; earning network + S2S format confirmed.
- [ ] A simulated valid S2S postback credits coins **once** (replay with same event id does nothing).
- [ ] Clients cannot write `wallets`/`ledger`/`rewardPool` (rules tested).
- [ ] Crediting stops when `rewardPool.poolBalance` is exhausted.
- [ ] Every credit produces a `ledger` entry that sums to `wallets.coins`.

**Est. effort:** ~3–5 days (plus external: ad-network confirmation time).
