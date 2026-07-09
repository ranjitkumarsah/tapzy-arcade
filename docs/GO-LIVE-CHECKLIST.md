# Tapzy Arcade — Go-Live Checklist

One place for every **manual** step to launch (code is done). Work top to bottom.

- **App:** `@TapzyArcadeBot` · Mini App: `https://t.me/TapzyArcadeBot/arcade`
- **Prod URL:** `https://tapzy-arcade-5rah.vercel.app`
- **Stack (all free, no card):** Vercel Hobby (frontend + 10 serverless functions) · Firebase Spark (Auth + Firestore) · Monetag ads · Telegram Stars

Legend: ⚙️ config · 🔒 secret · ✅ verify

---

## 1. Environment variables (Vercel → Settings → Environment Variables)

Set all of these, then **Redeploy** (VITE_ vars bake in at build time).

| Variable | Type | Purpose | Phase |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | public | Firebase web config | v1 P2 |
| `VITE_FIREBASE_AUTH_DOMAIN` | public | Firebase web config | v1 P2 |
| `VITE_FIREBASE_PROJECT_ID` | public | Firebase web config | v1 P2 |
| `VITE_FIREBASE_STORAGE_BUCKET` | public | Firebase web config | v1 P2 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | public | Firebase web config | v1 P2 |
| `VITE_FIREBASE_APP_ID` | public | Firebase web config | v1 P2 |
| `VITE_MONETAG_ZONE_ID` | public | Monetag SDK zone (ads + rewarded earning) | v1 P6 |
| `VITE_MONETAG_INAPP_ZONE_ID` | public (optional) | separate auto in-app zone; else reuses main | v1 P6 |
| `TELEGRAM_BOT_TOKEN` | 🔒 server | auth verify, bot photo, invoices, webhook | v1 P2 |
| `FIREBASE_SERVICE_ACCOUNT` | 🔒 server | Admin SDK (all money writes) | v1 P2 |
| `AD_POSTBACK_SECRET` | 🔒 server | verifies Monetag S2S reward postback | v2 P0 |
| `ECONOMY_POOL_ENFORCED` | ⚙️ server (optional) | `true` gates ad coins by the reward pool | v2 P0 |
| `STARS_WEBHOOK_SECRET` | 🔒 server | verifies the Telegram Stars webhook | v2 P7 |
| `ADMIN_SECRET` | 🔒 server | owner auth for `/api/withdraw/admin` | v2 P8 |

- [ ] All Firebase `VITE_*` set
- [ ] `TELEGRAM_BOT_TOKEN` + `FIREBASE_SERVICE_ACCOUNT` set
- [ ] `AD_POSTBACK_SECRET`, `STARS_WEBHOOK_SECRET`, `ADMIN_SECRET` set (long random strings)
- [ ] `VITE_MONETAG_ZONE_ID` set (once Monetag approved)
- [ ] **Redeployed** after setting/changing any of the above

---

## 2. Publish Firestore rules (Firebase Console → Firestore → Rules)

Paste the full contents of [`firestore.rules`](../firestore.rules) → **Publish**. This is required for these v2 features to read correctly (streaks, referrals, profiles, withdrawals).

- [ ] Rules published (current version, all collections below present)

Collections & access (server = Admin SDK, bypasses rules):

| Collection | Client access |
|---|---|
| `users`, `scores` | owner read/write |
| `leaderboard` | public read; owner writes own entry |
| `wallets`, `ledger`, `streaks`, `profiles` | owner **read only** (server writes) |
| `referrals` | invitee or referrer read; server writes |
| `withdrawals` | owner read own; server writes |
| `rewardPool`, `adCounters`, `purchases` | fully private (server only) |

---

## 3. Firebase sanity (Console)

- [ ] **Authentication** enabled; opening the app creates a `tg_<id>` user
- [ ] **Firestore** created in **Production mode**, on **Spark** (no Blaze/upgrade)
- [ ] After playing: `scores/tg_.../games/...` docs exist
- [ ] No `FIREBASE_SERVICE_ACCOUNT` JSON committed anywhere in the repo

---

## 4. Monetag ads + reward postback (S2S)

- [ ] Monetag account created; Mini App property added & **approved**
- [ ] Zone created; `VITE_MONETAG_ZONE_ID` set in Vercel
- [ ] **Postback URL** set in the Monetag zone (use their macro buttons):
  ```
  https://tapzy-arcade-5rah.vercel.app/api/adReward?secret=YOUR_AD_POSTBACK_SECRET&ymid={YMID}&paid={Reward event type}&reward={Estimated price}
  ```
- [ ] ✅ Watch a **real** (approved-traffic) rewarded ad → coins credit. *(Your own/test views come as `paid=no` and correctly credit nothing — verify wallet/spend via the curl in §9 instead.)*
- [ ] Ad frequency feels OK (interstitial on game-open + every-3-games; no mid-game ads)

> **Earn model gate (critical):** confirm Monetag permits **incentivized / cash-for-views** traffic. If not, switch the *earning* source to a compliant offerwall/rewarded-cash network before enabling withdrawals (§8).

---

## 5. Telegram Stars (payments)

- [ ] `STARS_WEBHOOK_SECRET` set in Vercel + redeployed
- [ ] Set the bot webhook (run once; same secret as env):
  ```bash
  curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://tapzy-arcade-5rah.vercel.app/api/stars/webhook","secret_token":"YOUR_STARS_WEBHOOK_SECRET","allowed_updates":["message","pre_checkout_query"]}'
  ```
  → expect `{"ok":true}`
- [ ] ✅ Store → buy **500 Coins** with Stars → balance rises
- [ ] ✅ Buy **Remove Ads** → interstitials stop; **Neon Theme** → toggles on
- [ ] (If checkout errors) @BotFather → your bot → **Payments** → confirm Stars enabled

---

## 6. BotFather polish (@BotFather)

- [ ] `/setuserpic` — Tapzy Arcade logo (512×512)
- [ ] `/setdescription` — e.g. *"Play 11 free mini-games — 2048, Snake, Bubble Shooter, Quiz & more. Earn coins!"*
- [ ] `/setabouttext` — short one-liner
- [ ] `/setmenubutton` — open `https://t.me/TapzyArcadeBot/arcade`
- [ ] `/setcommands` —
  ```
  play - Open Tapzy Arcade
  help - How to play
  ```
- [ ] `/myapps` — set Mini App photo/GIF
- [ ] (Optional) add `public/logo.png` in the repo for the splash screen (or it uses the bot photo via `/api/botPhoto`, else a monogram)

---

## 7. QA matrix

Test on **Telegram Desktop**, **Android**, **iOS**:

- [ ] Splash → launcher loads; theme matches light/dark; real name/avatar
- [ ] All **11 games** playable to game-over; scores save & persist on reopen
- [ ] Snake turns feel responsive; Bubble Shooter aim/shoot works
- [ ] Leaderboard tabs load; your rank shows on game-over
- [ ] Wallet: earn (real ad), Continue perk (Snake/Flappy), withdraw form
- [ ] Daily Spin (Watch & Spin), streak increments; Invite link + stats; Profile/badges
- [ ] Store purchases; Remove Ads suppresses ads; Neon theme applies
- [ ] Sound toggle + haptics; confetti on new best
- [ ] No horizontal scroll; no console errors

---

## 8. Withdrawals — gates before enabling real payouts

Withdrawals run in **manual-approval mode** (nothing auto-pays). Before letting users cash out:

- [ ] **Ad-policy confirmed** (§4) — cash-for-views allowed by your network
- [ ] **Payout rail chosen & ready** — USDT/TON, PayPal, or gift cards (you send funds manually)
- [ ] **`ADMIN_SECRET` set**; you can call the admin endpoint (§9)
- [ ] **Economics tuned** in `server/config.js`: `coinValueUsd` (now `0.0001` → 10,000 coins = $1), `withdrawMinCoins`, `withdrawMaxPerRequest`
- [ ] **Pool accounting** — decide `ECONOMY_POOL_ENFORCED=true` once revenue tracking is in place, so payouts never exceed 50% of realized revenue
- [ ] **Legal/compliance** — Terms & privacy covering rewards, eligibility, region/age, anti-fraud clawback; region gating as needed
- [ ] **Dry-run** a full request → approve → paid → and a reject (refund) in a test account first

---

## 9. Owner operations (quick reference)

**Credit test coins to yourself** (get your id from @userinfobot):
```bash
curl "https://tapzy-arcade-5rah.vercel.app/api/adReward?secret=YOUR_AD_POSTBACK_SECRET&ymid=YOURID&event_id=t1&reward=0"
```

**Process a withdrawal** (find pending ones in Firestore → `withdrawals`, `status == pending`):
```bash
# Approve
curl -X POST "https://tapzy-arcade-5rah.vercel.app/api/withdraw/admin" \
 -H "x-admin-secret: YOUR_ADMIN_SECRET" -H "Content-Type: application/json" \
 -d '{"id":"tg_123_abc","action":"approve"}'
# After you send the money:
curl -X POST ".../api/withdraw/admin" -H "x-admin-secret: YOUR_ADMIN_SECRET" \
 -H "Content-Type: application/json" -d '{"id":"tg_123_abc","action":"paid","txRef":"tx-ref"}'
# Or deny (auto-refunds held coins):
curl -X POST ".../api/withdraw/admin" -H "x-admin-secret: YOUR_ADMIN_SECRET" \
 -H "Content-Type: application/json" -d '{"id":"tg_123_abc","action":"reject","note":"reason"}'
```

**Serverless functions (10):** `verifyTelegramAuth`, `botPhoto`, `adReward`, `spend`, `claimDaily`, `referral`, `stars/createInvoice`, `stars/webhook`, `withdraw/request`, `withdraw/admin`. *(Vercel Hobby limit is 12 — headroom for 2 more.)*

---

## 10. Launch & monitor

- [ ] Soft-launch: share `https://t.me/TapzyArcadeBot/arcade` in a few relevant Telegram groups/channels
- [ ] Watch **Monetag** (impressions/eCPM), **Firebase usage** (stay within Spark free tier), **Vercel** function logs/usage
- [ ] Watch `withdrawals` queue and the `rewardPool`/`ledger` for economy health
- [ ] Iterate on ad frequency, coin rates, and game difficulty from real feedback

---

### Deploy flow (for reference)
Push to `main` → Vercel auto-builds & deploys the frontend **and** `/api` functions. Firestore rules deploy separately (console paste or `firebase deploy --only firestore:rules`).
