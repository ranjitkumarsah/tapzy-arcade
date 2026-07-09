# 🚀 Buyer Setup & Handover Guide

Everything you need to launch **your own branded instance** of this Telegram
mini-games hub. No paid services required — the whole stack runs on free tiers.

Work through the sections in order. Boxes (`[ ]`) are steps to complete.

---

## 0. What you'll set up

| Piece | Service | Free? |
|---|---|---|
| Bot + Mini App | Telegram (BotFather) | ✅ |
| Hosting (frontend + API) | Vercel | ✅ (Hobby) |
| Database + login | Firebase (Firestore + Auth) | ✅ (Spark) |
| Ads / rewarded earning | Monetag | ✅ |
| Payments | Telegram Stars | ✅ (built in) |

Estimated time for a technical user: **1–2 hours.**

---

## 1. Create your accounts (all free)

- [ ] **GitHub** — https://github.com (to host your copy of the code)
- [ ] **Vercel** — https://vercel.com (sign up with GitHub)
- [ ] **Firebase** — https://console.firebase.google.com
- [ ] **Monetag** — https://monetag.com (for ads; do this early — approval can take time)
- [ ] A **Telegram** account on your phone

---

## 2. Get the code into your own GitHub

1. [ ] Create a new **private** repo on GitHub (e.g. `my-arcade`).
2. [ ] Push this code to it:
   ```bash
   cd path/to/the/code
   git init
   git add -A
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/my-arcade.git
   git push -u origin main
   ```
3. [ ] Install & run locally to confirm it works:
   ```bash
   npm install
   npm run dev      # opens on localhost; shows a "not in Telegram" dev notice — normal
   npm run build    # should succeed
   ```

---

## 3. Rebrand it (change the name & bot)

Branding is centralized. Edit **`src/appConfig.js`** — this one file controls the
name, bot, share text:

```js
export const APP_NAME = 'Tapzy Arcade'          // -> your app name
export const APP_TAGLINE = 'Tap · Play · Compete' // -> your tagline
export const BOT_USERNAME = 'TapzyArcadeBot'     // -> your bot username (no @)
export const APP_SHORT_NAME = 'arcade'           // -> your Mini App short name (step 4)
export const SHARE_TEXT = `Play free mini games on ${APP_NAME}! 🎮`
```

Then two files that can't read JS, edit by hand:
- [ ] **`index.html`** → `<title>Tapzy Arcade</title>` → your name
- [ ] **`package.json`** → `"name"` and `"description"`

Optional branding:
- [ ] **`public/logo.png`** → drop your own square logo (≈512×512) for the splash screen.
- [ ] Colors auto-match Telegram's light/dark theme. To force your own accent, edit
  `src/styles/theme.css` (the `--accent` variable) and the Neon premium theme block.

> You'll set `BOT_USERNAME` / `APP_SHORT_NAME` to real values after step 4, then push again.

---

## 4. Create your Telegram bot + Mini App (@BotFather)

1. [ ] In Telegram open **@BotFather** → `/newbot` → set a name and a **username**
   (must end in `bot`). **Copy the bot token** it gives you (keep it secret).
2. [ ] `/newapp` → pick your bot → set a **title** and a **short name** (e.g. `arcade`).
   You'll paste your live URL here in step 7. The deep link becomes
   `https://t.me/<your-bot>/<short-name>`.
3. [ ] Put the bot username and short name into `src/appConfig.js` (step 3),
   commit & push.

---

## 5. Set up Firebase (free Spark plan — no card)

1. [ ] Firebase Console → **Add project** (Analytics optional).
2. [ ] **Build → Authentication → Get started** (enabling it once is enough).
3. [ ] **Build → Firestore Database → Create database → Production mode** → pick a region.
   ⚠️ Stay on **Spark**. If asked to upgrade/add a card, you don't need to.
4. [ ] Project settings → **Your apps → Web app** → register → **copy the config values**
   (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
5. [ ] Project settings → **Service accounts → Generate new private key** → downloads a
   JSON file. **Copy its entire contents** (keep it secret; don't commit it).

---

## 6. Deploy to Vercel

1. [ ] https://vercel.com/new → **Import** your GitHub repo.
2. [ ] Framework preset auto-detects **Vite** (build `npm run build`, output `dist`).
3. [ ] **Deploy** → copy your production URL (e.g. `https://my-arcade.vercel.app`).

---

## 7. Set environment variables (Vercel → Settings → Environment Variables)

Add all of these, then **Redeploy** (the `VITE_` ones bake in at build time).

| Variable | Value | Secret? |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | from step 5.4 | public |
| `VITE_FIREBASE_AUTH_DOMAIN` | from step 5.4 | public |
| `VITE_FIREBASE_PROJECT_ID` | from step 5.4 | public |
| `VITE_FIREBASE_STORAGE_BUCKET` | from step 5.4 | public |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from step 5.4 | public |
| `VITE_FIREBASE_APP_ID` | from step 5.4 | public |
| `TELEGRAM_BOT_TOKEN` | from step 4.1 | 🔒 |
| `FIREBASE_SERVICE_ACCOUNT` | the whole JSON from step 5.5 | 🔒 |
| `AD_POSTBACK_SECRET` | any long random string | 🔒 |
| `STARS_WEBHOOK_SECRET` | any long random string | 🔒 |
| `ADMIN_SECRET` | any long random string | 🔒 |
| `VITE_MONETAG_ZONE_ID` | from step 9 (add when ready) | public |

- [ ] All set
- [ ] **Redeployed**

Then register your live URL as the Mini App:
- [ ] @BotFather → `/myapps` → your app → **Edit Web App URL** → paste your Vercel URL.
- [ ] Open `https://t.me/<your-bot>/<short-name>` on your phone → the app loads and
  auto-signs you in.

---

## 8. Publish the database security rules

- [ ] Firebase Console → **Firestore → Rules** → paste the contents of the repo's
  **`firestore.rules`** → **Publish**.

This is required — several features (daily streaks, referrals, purchases, withdrawals)
read data that these rules protect. Money collections are server-write-only by design.

---

## 9. Ads + rewarded earning (Monetag)

1. [ ] Create your Monetag account, add your Mini App as a property, wait for approval.
2. [ ] Create an ad **zone**; copy its **Zone ID** → set `VITE_MONETAG_ZONE_ID` in Vercel → Redeploy.
3. [ ] In the zone's **Postback / S2S** settings, set the reward postback URL (use their
   macro buttons for the `{...}` parts):
   ```
   https://<your-vercel-url>/api/adReward?secret=<AD_POSTBACK_SECRET>&ymid={YMID}&paid={Reward event type}&reward={Estimated price}
   ```
   This is how watching an ad credits withdrawable coins **server-side** (users can't fake it).

> Note: your own/test ad views usually come back as unpaid and correctly credit nothing.
> Coins accrue on real, monetized traffic.

---

## 10. Telegram Stars payments (Store)

- [ ] Set the bot webhook once (same secret as `STARS_WEBHOOK_SECRET`):
  ```bash
  curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://<your-vercel-url>/api/stars/webhook","secret_token":"<STARS_WEBHOOK_SECRET>","allowed_updates":["message","pre_checkout_query"]}'
  ```
  Expect `{"ok":true}`.
- [ ] Test: open the app → **🛍️ Store** → buy the cheapest coin pack with Stars → your
  balance rises. Buy **Remove Ads** → interstitials stop.
- [ ] Product names/prices live in **`server/products.js`** (`STARS_PRODUCTS`). Edit
  the display mirror in **`src/economy/storeProducts.js`** to match.

---

## 11. Test everything

- [ ] App opens in Telegram, correct name/logo on the splash, auto sign-in
- [ ] All games play; scores save and persist on reopen; leaderboards load
- [ ] Wallet shows; watching a real ad credits coins; "Continue" spends coins
- [ ] Daily Spin, streaks, referrals (needs a 2nd Telegram account), Profile/badges
- [ ] Store purchases work; Remove Ads applies
- [ ] Test on Telegram **Desktop, Android, and iOS**

---

## 12. Tune the economy (optional)

In **`server/config.js`**:
- `coinValueUsd` — how much 1 coin is worth (default `0.0001` → 10,000 coins = $1).
- `coinsPerAd`, `dailyAdRewardCap` — earning rate and anti-farming cap.
- `withdrawMinCoins`, `withdrawMaxPerRequest` — withdrawal limits.
- `poolSplit` — user share of ad revenue (default 50%).

Set `ECONOMY_POOL_ENFORCED=true` (Vercel env) once you're tracking real revenue, so
total ad-coin payouts can't exceed your reward pool.

---

## 13. Enabling real withdrawals (read before turning on payouts)

Withdrawals ship in **manual-approval mode** — nothing pays out automatically. Before
letting users cash out real money, **you** must:

- [ ] Confirm your **ad network permits incentivized / cash-for-views** traffic.
- [ ] Choose a **payout rail** (USDT/TON, PayPal, or gift cards) — you send funds manually.
- [ ] Handle **legal/tax/region/age** requirements and publish Terms for your market.

Process requests (find pending ones in Firestore → `withdrawals`, `status == pending`):
```bash
# Approve
curl -X POST "https://<your-vercel-url>/api/withdraw/admin" \
 -H "x-admin-secret: <ADMIN_SECRET>" -H "Content-Type: application/json" \
 -d '{"id":"tg_123_abc","action":"approve"}'
# After you've sent the money:
curl -X POST ".../api/withdraw/admin" -H "x-admin-secret: <ADMIN_SECRET>" \
 -H "Content-Type: application/json" -d '{"id":"tg_123_abc","action":"paid","txRef":"tx-ref"}'
# Or deny (auto-refunds the held coins):
curl -X POST ".../api/withdraw/admin" -H "x-admin-secret: <ADMIN_SECRET>" \
 -H "Content-Type: application/json" -d '{"id":"tg_123_abc","action":"reject","note":"reason"}'
```

---

## 14. Troubleshooting

| Symptom | Fix |
|---|---|
| Blank screen / auth error | Check all `VITE_FIREBASE_*` are set and you **redeployed**; publish Firestore rules |
| "Not running inside Telegram" | You're in a browser — open via your bot's Mini App link |
| Ads never credit coins | Postback URL set in Monetag? Account approved? Test views are usually unpaid (correct) |
| Daily/streak shows 0 | Publish the latest `firestore.rules` |
| Stars checkout fails | Webhook set (step 10)? @BotFather → bot → Payments enabled? |
| Changed name but old name shows | Redeploy after editing `src/appConfig.js`; hard-reopen the Mini App |

---

## Reference

- **Serverless API** (`/api`): `verifyTelegramAuth`, `botPhoto`, `adReward`, `spend`,
  `claimDaily`, `referral`, `stars/createInvoice`, `stars/webhook`, `withdraw/request`,
  `withdraw/admin`.
- **Architecture, data model, security:** see the repo `README.md`.
- **How it was built (phase by phase):** `docs/implementation/`.

You now own a full, secure, revenue-ready Telegram game platform. 🎉
