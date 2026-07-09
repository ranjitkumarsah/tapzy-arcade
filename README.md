# 🎮 Tapzy Arcade — Telegram Mini-Games Hub

A production-ready **Telegram Mini App**: 11 casual games in one launcher, a full
**watch-to-earn coin economy** (withdrawable), daily rewards, referrals, profiles,
**Telegram Stars** payments, and ads — all on a **$0, no-credit-card** stack.

- **Live:** [`t.me/TapzyArcadeBot/arcade`](https://t.me/TapzyArcadeBot/arcade)
- **Specs & build plan:** [`docs/`](docs/) · [`docs/implementation/`](docs/implementation/)

---

## ✨ Features

**11 games** (all lazy-loaded, touch-first, leaderboard-ready): Tic-Tac-Toe · Memory
Match · Quiz · 2048 · Snake · Flappy · Reaction · Whack-a-Mole · Simon · Color Match ·
Bubble Shooter.

- **Zero-friction auth** — auto sign-in via Telegram `initData` → Firebase custom token (no signup)
- **Per-game leaderboards** + personal-best tracking
- **Coin economy** — earn **withdrawable** coins from verified ad watches (server-authoritative, idempotent ledger); spend on perks (Continue/revive)
- **Daily spin-the-wheel + streaks**, **referrals** (invite → both earn), **profile** with XP/levels/badges
- **Telegram Stars** — Remove Ads, coin packs, premium theme (server-verified entitlements)
- **Withdrawals** — real cash-out in safe manual-approval mode (pool accounting, clawback)
- **Ads** — Monetag rewarded + interstitial, frequency-capped, S2S reward postback
- **Polish** — animated splash, confetti, count-ups, synthesized per-game music + haptics, light/dark theme, reduced-motion

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite (lazy-loaded games, code-split vendors) |
| Backend | Vercel Serverless Functions (`/api`, free Hobby) |
| Data/Auth | Firebase Firestore + Auth (free Spark) |
| Ads | Monetag (rewarded + interstitial, S2S postback) |
| Payments | Telegram Stars (Bot Payments API, `XTR`) |
| Audio | Web Audio API (synthesized — zero binary assets) |
| Tests | Vitest |

No paid services, no credit card.

---

## 📁 Structure

```
├── api/                      # Vercel serverless functions (10)
│   ├── verifyTelegramAuth.js #   Telegram initData -> Firebase custom token
│   ├── botPhoto.js           #   bot avatar for the splash
│   ├── adReward.js           #   Monetag S2S -> credit withdrawable coins
│   ├── spend.js              #   spend coins on perks
│   ├── claimDaily.js         #   daily spin + streaks
│   ├── referral.js           #   referral register + reward
│   ├── stars/                #   Telegram Stars invoice + webhook
│   └── withdraw/             #   withdrawal request + owner admin
├── server/                   # shared server libs (Admin SDK, economy, config)
├── src/
│   ├── games/                # 11 self-contained games (+ pure logic modules)
│   ├── components/           # launcher, GameShell, modals (wallet/store/daily/…)
│   ├── economy/              # wallet, spend, daily, referral, stars, withdraw
│   ├── telegram/             # WebApp SDK integration + auth hook
│   ├── ads/ · sound/ · profile/ · theme/ · context/ · styles/
├── firestore.rules           # security rules (money = server-write only)
└── docs/                     # PRD, TRD, phased build plans
```

**Data model (Firestore):** `users`, `scores`, `leaderboard`, `wallets`, `ledger`,
`streaks`, `referrals`, `profiles`, `withdrawals`, `purchases`, `rewardPool`,
`adCounters`. All money collections are **server-write-only** (Admin SDK); clients read.

---

## 🔒 Security model

- Real-money coins are **never** credited client-side. Only serverless functions (Admin
  SDK) write `wallets`/`ledger`; Firestore rules make them read-only to clients.
- Ad rewards require Monetag's **server-to-server postback** (users can't self-credit).
- All credits/debits are **atomic** (transactions), **idempotent** (dedup keys), and
  **double-entry logged**. Spends/Stars/withdrawals verify the caller's Firebase ID token.

---

## 🚀 Local development

```bash
npm install
npm run dev       # http://localhost:5173 (also on your LAN IP for phone testing)
npm test          # Vitest
npm run build     # -> dist/
```

Outside Telegram the app runs in a dev mode (mock user, no ads/economy). Open it through
your bot to exercise the full Telegram integration.

## Environment & deploy

Copy `.env.example` → `.env`. Public `VITE_*` config goes in the client; secrets
(`TELEGRAM_BOT_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, `AD_POSTBACK_SECRET`,
`STARS_WEBHOOK_SECRET`, `ADMIN_SECRET`) go **only** in the Vercel dashboard — never the
repo. Push to `main` → Vercel auto-deploys frontend + `/api`. Firestore rules deploy via
console paste or `firebase deploy --only firestore:rules`.

---

## Status

**Complete** — v1 (games + auth + leaderboards + ads) and v2 (economy, daily, referrals,
profile, Stars, withdrawals, +5 games, visual polish) are all code-complete. Remaining
work is operational (secrets, rules publish, webhook, BotFather, QA) per the checklist.
