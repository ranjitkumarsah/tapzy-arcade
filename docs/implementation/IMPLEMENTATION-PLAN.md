# Implementation Plan — Tapzy Arcade (Telegram Mini-Games Hub)

**Version:** 1.0
**Date:** 2026-07-09
**Based on:** [PRD](../PRD-Telegram-Mini-Games-Hub.md) v1.0 · [TRD](../TRD-Telegram-Mini-Games-Hub.md) v1.0
**Budget:** $0 (100% free stack)

---

## 0. Locked Decisions

These were confirmed before planning and drive every phase below.

| Decision | Choice | Notes |
|---|---|---|
| **App name** | **Tapzy Arcade** | Unique + searchable. Proposed bot handle: `@TapzyArcadeBot` (must be verified available in BotFather — see Phase 0 manual steps). Short-name for the Mini App URL: `arcade` → link `https://t.me/TapzyArcadeBot/arcade`. |
| **Score storage** | **Firebase from the start** | Telegram auth → Firebase custom token → Firestore for scores + leaderboards. Built in Phase 2, before any game saves a score. |
| **Auth function host** | **Vercel Serverless Function** (not Firebase Cloud Functions) | User requires 100% free with **no credit card**. Firebase Cloud Functions now require the Blaze plan (card on file). Firestore + Firebase Auth stay on the free Spark plan; the `verifyTelegramAuth` token-minting logic runs as a Vercel serverless function (`/api`, free Hobby tier, no card). |
| **Quiz topics** | **General Knowledge + Science & Tech** | Static JSON question bank bundled with the app. |
| **Ad network** | **Monetag** | Rewarded interstitial + interstitial + banner. Wrapped in one module so it can be swapped later. |
| **Frontend** | React + Vite | Per TRD. |
| **Games (6)** | Tic-Tac-Toe, Memory Match, Quiz, 2048, Snake, Flappy-clone | Build order easiest → hardest. |
| **Hosting** | Vercel (free tier) | Auto HTTPS + CDN + auto-deploy on push. (Cloudflare Pages is an equivalent fallback.) |

---

## 1. Guiding Principles

- **One phase = one shippable, verifiable milestone.** You can stop after any phase and still have a working app.
- **Manual steps are called out explicitly.** Anything you (the human) must do in a browser dashboard, BotFather, or a signup flow is marked with a **🔧 MANUAL STEP** block with exact instructions. Claude cannot do these; everything else Claude writes as code.
- **Secrets never go in the repo.** Bot token, Firebase config, Monetag ID all live in environment variables / dashboard config. A `.env.example` documents the shape; the real `.env` is git-ignored.
- **Abstraction at the seams.** Ads, Firebase, and Telegram are each wrapped in a small module so swapping providers later is a one-file change.

---

## 2. Phase Overview

| Phase | File | Deliverable | Depends on |
|---|---|---|---|
| 0 | [phase-00-setup-and-bot.md](phase-00-setup-and-bot.md) | Repo + Vite React skeleton + "Hello World" deployed to HTTPS + bot registered, opens inside Telegram | — |
| 1 | [phase-01-telegram-integration.md](phase-01-telegram-integration.md) | Telegram WebApp SDK wired: `ready`/`expand`, theme, shows real Telegram user name | 0 |
| 2 | [phase-02-firebase-auth.md](phase-02-firebase-auth.md) | Firebase project (Spark/free) + `verifyTelegramAuth` **Vercel serverless function** + custom-token sign-in + Firestore rules | 1 |
| 3 | [phase-03-launcher-and-easy-games.md](phase-03-launcher-and-easy-games.md) | Launcher grid + `GameShell` + score saving + Tic-Tac-Toe, Memory Match, Quiz | 2 |
| 4 | [phase-04-canvas-games.md](phase-04-canvas-games.md) | 2048, Snake, Flappy-clone | 3 |
| 5 | [phase-05-leaderboard.md](phase-05-leaderboard.md) | Per-game leaderboard UI wired to Firestore | 2, 3 |
| 6 | [phase-06-monetag-ads.md](phase-06-monetag-ads.md) | Monetag rewarded + interstitial + banner, frequency-capped | 3 |
| 7 | [phase-07-share-polish-launch.md](phase-07-share-polish-launch.md) | Share button, UI polish, QA matrix, soft launch | all |

**Recommended stopping points for a solo builder:** after Phase 3 you have a playable multi-game app with saved scores; after Phase 6 it's monetized; Phase 7 is launch.

---

## 3. Repository Structure (target)

```
tapzy-arcade/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── firebase.json                 # Firestore rules deploy only (free, no Blaze)
├── firestore.rules
├── .firebaserc
├── public/
│   └── icons/                    # game + app icons
├── api/                          # Vercel Serverless Functions (free Hobby tier)
│   └── verifyTelegramAuth.js     # verifies initData, mints Firebase custom token
├── src/
│   ├── main.jsx
│   ├── App.jsx                   # Router: launcher <-> game screens
│   ├── telegram/
│   │   ├── initTelegram.js
│   │   └── useTelegramAuth.js
│   ├── firebase/
│   │   ├── firebaseConfig.js
│   │   ├── scores.js
│   │   └── leaderboard.js
│   ├── ads/
│   │   └── monetag.js
│   ├── games/
│   │   ├── TicTacToe/
│   │   ├── MemoryMatch/
│   │   ├── Quiz/
│   │   │   └── questions.json    # General Knowledge + Science & Tech
│   │   ├── Game2048/
│   │   ├── Snake/
│   │   └── FlappyClone/
│   ├── components/
│   │   ├── Launcher.jsx
│   │   ├── GameShell.jsx
│   │   ├── GameOverModal.jsx
│   │   └── Leaderboard.jsx
│   ├── context/
│   │   └── AppContext.jsx        # auth state, user, ad frequency counters
│   └── styles/
└── docs/
```

---

## 4. Environment Variables (documented, never committed)

| Variable | Where used | Set in | Phase |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` (+ other `VITE_FIREBASE_*` config keys) | Frontend | Vercel dashboard + local `.env` | 2 |
| `VITE_MONETAG_ZONE_ID` | Frontend | Vercel dashboard + local `.env` | 6 |
| `TELEGRAM_BOT_TOKEN` | Vercel serverless function | Vercel dashboard (server-side, **no** `VITE_` prefix) | 2 |
| `FIREBASE_SERVICE_ACCOUNT` (JSON) | Vercel serverless function | Vercel dashboard (server-side) | 2 |

Firebase config keys prefixed `VITE_` are **not secret** (they're public client config protected by Firestore rules). The bot token and the Firebase **service account** JSON **are** secret and only live server-side in the Vercel function's environment variables (never `VITE_`-prefixed, so they're never bundled into the client).

---

## 5. Definition of Done (v1)

- App opens instantly inside Telegram (Desktop, Android, iOS) with no console errors.
- User is auto-identified via Telegram; scores persist per Telegram ID in Firestore.
- All 6 games are playable and save high scores.
- Per-game leaderboard shows top 50.
- Monetag rewarded (opt-in), interstitial (frequency-capped), and banner render correctly.
- Share button opens Telegram's native share sheet.
- No secrets in the repo; deploys are automatic on push to `main`.

---

## 6. How to use these phase files

Each phase file contains: **Goal**, **Prerequisites**, **Tasks** (Claude does these as code), **🔧 Manual Steps** (you do these), **Files touched**, **Acceptance criteria / how to verify**, and **Est. effort**. Work top to bottom; do not start a phase until its prerequisites' acceptance criteria pass.
