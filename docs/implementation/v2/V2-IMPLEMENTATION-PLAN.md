# Tapzy Arcade — v2 Implementation Plan

**Version:** 2.0
**Date:** 2026-07-09
**Builds on:** v1 (complete) — see [../IMPLEMENTATION-PLAN.md](../IMPLEMENTATION-PLAN.md)
**App:** Tapzy Arcade · `@TapzyArcadeBot` · `https://t.me/TapzyArcadeBot/arcade`

---

## 0. What v2 adds (confirmed decisions)

| Area | Decision |
|---|---|
| **Coins economy** | A coin system. Coins are **withdrawable (real money)** and are earned **only by watching rewarded ads**. Coins can also be spent in-app (extra lives/retries/continues, cosmetics). |
| **Reward pool funding** | The user reward pool = **50% of net CPI/CPC ad revenue** (50/50 split between you and players). Total coin payouts are capped by this pool. |
| **Daily streaks & rewards** | Daily login bonus, streak multiplier, spin-the-wheel — pays out coins. |
| **Referral rewards** | Invite via the existing `?startapp=ref_<uid>` link → both referrer and invitee get coins. |
| **Achievements & profile** | Profile screen, XP/levels, badges, lifetime stats. |
| **Visual** | **Rich polish within Telegram's theme** — animations, celebration effects, better cards/transitions. Not a full rebrand. |
| **Telegram Stars** | **Yes** — sell **Remove Ads** + premium (themes / coin packs) for Telegram Stars. |
| **More games** | **4–6 new games** added to the catalog. |

---

## 1. The economy model (read this first)

```
Ad revenue (CPI/CPC)  ──50%──▶  Reward Pool  ──▶  Users' withdrawable coin balances
                      ──50%──▶  You (profit)

Earning:   watch rewarded ad ──▶ Monetag S2S postback ──▶ server credits coins (verified)
Spending:  coins ──▶ in-game perks (extra life/retry) OR ──▶ withdrawal request (cash out)
Paying:    Telegram Stars ──▶ Remove Ads / premium themes / coin packs
```

- **1 coin = a fixed micro-value** you set (e.g., pegged so total liabilities never exceed the reward pool). The server enforces this; the rate is a server config, not client-controlled.
- **Withdrawable coins are a real financial liability.** Every design choice below optimizes for: (a) never paying out more than the pool, (b) never crediting an unverified ad, (c) resisting fraud.

> ⚠️ **Critical gate — do this before building the economy (V2-P0):** confirm your ad network's policy on **incentivized traffic + real-cash rewards**, and that it supports **server-side reward postbacks (S2S)**. Monetag and many networks restrict or ban cash-for-views. If Monetag disallows it, switch the earning source to a **compliant rewarded/offerwall network** (e.g., an offerwall SDK that explicitly permits cash rewards). Getting this wrong risks withheld payments or a banned account.

---

## 2. Architecture change vs v1

v1 let the **client write** scores/leaderboard directly to Firestore (fine — non-monetary). v2 introduces **money**, so:

- **All coin/wallet writes are server-authoritative.** Clients can *read* their balance but **cannot write** it. Firestore rules make `wallets/*`, `ledger/*`, `withdrawals/*` **read-only to clients**; only the Firebase Admin SDK (inside Vercel serverless functions) writes them.
- **New serverless functions** (Vercel `/api`, same free tier as v1's auth function) handle: ad-reward postback, spend, daily/streak claim, referral claim, Stars payment verification, withdrawal request.
- **Every balance change is double-entry logged** in a `ledger` subcollection (source, amount, timestamp, idempotency key) for auditability and dispute resolution.

```
/api
 ├── verifyTelegramAuth.js   (v1)
 ├── botPhoto.js             (v1)
 ├── adReward.js             (NEW — Monetag S2S postback → credit coins)
 ├── spend.js                (NEW — atomic spend for perks)
 ├── claimDaily.js           (NEW — streak/daily/spin)
 ├── claimReferral.js        (NEW)
 ├── stars/createInvoice.js  (NEW — Telegram Stars invoice)
 ├── stars/webhook.js        (NEW — verify Stars payment)
 └── withdraw/request.js     (NEW — withdrawal request + checks)
```

Firestore additions:
```
wallets/{uid}            - coins, lifetimeEarned, updatedAt        (server-write only)
ledger/{uid}/entries/{id}- type, amount, meta, createdAt          (server-write only)
rewardPool/global        - poolBalance, revenueToDate, paidToDate  (server-write only)
withdrawals/{id}         - uid, amount, method, status, createdAt  (server-write only)
referrals/{uid}          - referredBy, referredUids[], claimedAt   (server-write only)
profiles/{uid}           - xp, level, badges[], entitlements{ noAds, themes[] }
streaks/{uid}            - current, longest, lastClaimDate
```

---

## 3. Phase overview

| Phase | File | Deliverable | Depends on |
|---|---|---|---|
| P0 | [v2-phase-00-foundations-and-ad-policy.md](v2-phase-00-foundations-and-ad-policy.md) | Ad-policy gate + server-authoritative wallet/ledger + Monetag S2S wiring | v1 |
| P1 | [v2-phase-01-coins-earn-and-spend.md](v2-phase-01-coins-earn-and-spend.md) | Wallet UI; earn coins from verified ad watches; spend on perks | P0 |
| P2 | [v2-phase-02-daily-streaks.md](v2-phase-02-daily-streaks.md) | Daily bonus, streaks, spin-the-wheel | P1 |
| P3 | [v2-phase-03-referrals.md](v2-phase-03-referrals.md) | Referral tracking + rewards + anti-abuse | P1 |
| P4 | [v2-phase-04-achievements-profile.md](v2-phase-04-achievements-profile.md) | Profile, XP/levels, badges, stats | P1 |
| P5 | [v2-phase-05-visual-polish.md](v2-phase-05-visual-polish.md) | Animations, celebrations, richer launcher/cards/transitions | v1 (parallel-safe) |
| P6 | [v2-phase-06-more-games.md](v2-phase-06-more-games.md) | 4–6 new games | v1 |
| P7 | [v2-phase-07-telegram-stars.md](v2-phase-07-telegram-stars.md) | Stars: Remove Ads + premium themes + coin packs | P1 |
| P8 | [v2-phase-08-withdrawals.md](v2-phase-08-withdrawals.md) | Withdrawable payouts, reward-pool accounting, fraud controls, compliance | P0–P4, P7 |

**Recommended order for a solo builder:** P0 → P1 → (P5 visual polish + P6 games in parallel for momentum) → P2 → P3 → P4 → P7 → **P8 last** (highest risk; only after the economy is proven and fraud controls exist).

---

## 4. Cross-cutting requirements

- **Idempotency:** every credit (ad reward, referral, daily, Stars) carries a unique key; the server rejects duplicates so a retried request never double-credits.
- **Atomicity:** spend/withdraw use Firestore transactions so balances can't go negative or race.
- **Anti-fraud (built up across phases, enforced before P8):** per-user/day ad-reward caps, device/session heuristics, referral self/loop detection, velocity checks, manual review queue for withdrawals.
- **Auditability:** the `ledger` is the source of truth; `wallets.coins` is a cached sum reconcilable from it.
- **Free-tier posture:** stays on Vercel Hobby + Firebase Spark. Watch Firestore write counts (economy adds writes) — batch/transaction and only-on-change writes as in v1.

---

## 5. Risks & mitigations (v2-specific)

| Risk | Mitigation |
|---|---|
| Ad network bans incentivized/cash rewards | **V2-P0 gate**: verify Monetag policy or switch to a compliant rewarded/offerwall network before building earning |
| Ad fraud / farming inflates payouts | Server-only credit via S2S postback; per-day caps; velocity + device checks; pool cap |
| Payouts exceed revenue | Hard rule: total credited ≤ 50% of realized net revenue; pool balance gates crediting |
| No cash payout rail | Choose crypto (USDT/TON), PayPal, or gift cards in P8; Stars is inbound-only |
| Legal/tax/region rules for cash rewards | Add T&C, region gating, minimum age, and record-keeping in P8; consult local rules |
| Real-money bugs = real losses | Idempotency + transactions + ledger + staging tests before enabling withdrawals |

---

## 6. Definition of done (v2)

- Verified rewarded-ad watches credit withdrawable coins server-side; balances are tamper-proof.
- Coins spendable on in-game perks and cosmetics.
- Daily streaks, referrals, achievements/profile live and paying coins correctly.
- Telegram Stars sells Remove Ads + premium; entitlements enforced server-side.
- 4–6 new games shipped; app visibly more polished (animations/celebrations) within Telegram theme.
- Withdrawals work end-to-end within pool limits, with fraud controls and a payout method — launched last.
