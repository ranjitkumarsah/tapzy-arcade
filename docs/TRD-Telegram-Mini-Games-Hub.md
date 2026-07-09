# TRD: Telegram Mini-Games Hub

**Version:** 1.0
**Date:** July 2026
**Based on:** PRD-Telegram-Mini-Games-Hub v1.0
**Stack decisions:** React frontend · Firebase backend (leaderboard) · Monetag ads · 6 games in v1

---

## 1. Architecture Overview

```
┌─────────────────────┐
│   Telegram Client    │  (mobile/desktop app)
└─────────┬────────────┘
          │ opens WebView
          ▼
┌─────────────────────────────────────────┐
│  React Mini App (hosted on Vercel/       │
│  Cloudflare Pages, free tier, HTTPS)     │
│  - Game launcher                         │
│  - 6 game modules                        │
│  - Monetag ad SDK                        │
│  - Telegram WebApp SDK (initData, share) │
└─────────┬─────────────────────┬─────────┘
          │                     │
          ▼                     ▼
┌────────────────────┐  ┌──────────────────────┐
│ Firebase Cloud      │  │ Firebase Firestore    │
│ Function:           │  │ - users               │
│ verifyTelegramAuth  │  │ - scores              │
│ (mints custom token)│  │ - leaderboard (per    │
└────────────────────┘  │   game, cached top N) │
                         └──────────────────────┘
```

The React app is fully static (client-side rendered) and talks to Firebase directly via the Firebase JS SDK once authenticated. No custom backend server needed beyond one small Cloud Function used only for verifying Telegram identity — this keeps everything inside Firebase's free (Spark) tier.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | React (via Vite) | Fast dev server, small bundle, easy component structure per game |
| Styling | CSS Modules or Tailwind (utility classes) | Keep bundle light |
| Telegram integration | `@twa-dev/sdk` or raw `telegram-web-app.js` | Gives `initData`, theme, MainButton, share, haptics |
| State management | React Context + hooks (no Redux needed at this scale) | |
| Backend | Firebase (Spark/free plan) | Firestore + 1 Cloud Function |
| Auth | Custom Firebase Auth token, minted after verifying Telegram `initData` server-side | Avoids a full login flow; user is auto-identified |
| Database | Firestore | Stores per-user scores + leaderboard docs |
| Ads | Monetag SDK | Rewarded interstitial, interstitial, banner |
| Hosting | Vercel or Cloudflare Pages (free tier) | Auto HTTPS + CDN, required by Telegram |
| Bot | Telegram Bot API via BotFather | Free; just need a token + Mini App URL registered |
| CI/CD | GitHub + Vercel/Cloudflare auto-deploy on push | Free |

---

## 3. Repository Structure

```
telegram-mini-games/
├── src/
│   ├── main.jsx
│   ├── App.jsx                  # Router: launcher <-> game screens
│   ├── telegram/
│   │   ├── initTelegram.js      # Reads WebApp.initData, theme, MainButton
│   │   └── useTelegramAuth.js   # Hook: exchanges initData for Firebase token
│   ├── firebase/
│   │   ├── firebaseConfig.js
│   │   ├── scores.js            # read/write score docs
│   │   └── leaderboard.js       # read top-N leaderboard docs
│   ├── ads/
│   │   └── monetag.js           # wrapper around Monetag SDK calls
│   ├── games/
│   │   ├── Game2048/
│   │   ├── Snake/
│   │   ├── TicTacToe/
│   │   ├── MemoryMatch/
│   │   ├── FlappyClone/
│   │   └── Quiz/
│   ├── components/
│   │   ├── Launcher.jsx
│   │   ├── GameOverModal.jsx    # includes "watch ad to retry"
│   │   └── Leaderboard.jsx
│   └── styles/
├── functions/                   # Firebase Cloud Functions
│   └── verifyTelegramAuth.js
├── firestore.rules
├── firebase.json
├── vite.config.js
└── package.json
```

---

## 4. Telegram Integration

1. On app load, call `Telegram.WebApp.ready()` and `Telegram.WebApp.expand()`.
2. Read `Telegram.WebApp.initData` (raw string) and `initDataUnsafe` (parsed, for immediate UI use — display name/avatar only, never trust for security).
3. Send raw `initData` to the Cloud Function `verifyTelegramAuth`.
4. Use Telegram's native **Share** API for the "Share with friends" button (`Telegram.WebApp.switchInlineQuery` or a shareable deep link `https://t.me/<bot>/<app>?startapp=ref_<userid>` for referral tracking later).
5. Use `MainButton`/`BackButton` APIs for native-feeling navigation instead of custom UI buttons where possible (better UX inside Telegram).

---

## 5. Authentication Flow (Firebase, free-tier safe)

Telegram's `initData` includes a `hash` signed with your bot token. Verifying it requires only local HMAC-SHA256 computation — no outbound network calls — so this fits Firebase's free Spark plan (Cloud Functions on Spark can't make arbitrary outbound HTTP calls, but pure computation is fine).

**Cloud Function: `verifyTelegramAuth`**
1. Receives `initData` string from client.
2. Recomputes the hash using your bot token (stored as a Firebase Function secret/env var) and compares it to the hash Telegram provided.
3. Checks `auth_date` isn't too old (e.g., reject if older than 24h) to prevent replay.
4. If valid, extracts the Telegram `user.id` and mints a Firebase Custom Auth Token for a UID like `tg_<telegram_user_id>`.
5. Returns the custom token to the client.
6. Client calls `signInWithCustomToken()` — now the user has a real Firebase Auth session tied 1:1 to their Telegram ID, with no password, no signup form.

---

## 6. Data Model (Firestore)

```
users/{uid}
  - telegramId: number
  - firstName: string
  - username: string
  - createdAt: timestamp
  - lastSeen: timestamp

scores/{uid}/games/{gameId}
  - highScore: number
  - lastPlayedAt: timestamp
  - playCount: number

leaderboard/{gameId}/entries/{uid}
  - uid: string
  - displayName: string
  - score: number
  - updatedAt: timestamp
```

- `leaderboard/{gameId}/entries` is queried with `orderBy('score', 'desc').limit(50)` to show top 50 per game — cheap and fast on the free tier.
- Writing a leaderboard entry only happens when a user beats their own `highScore`, to minimize writes (Firestore free tier: 20K writes/day, 50K reads/day — plenty for a small/medium app).

---

## 7. Firestore Security Rules (draft)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /scores/{uid}/games/{gameId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /leaderboard/{gameId}/entries/{uid} {
      allow read: if true;  // public leaderboard
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.data.score is number;
    }
  }
}
```

This prevents users from writing/reading each other's private score data while allowing the public leaderboard to be visible to everyone.

---

## 8. Ad Integration (Monetag)

1. Sign up with Monetag, register the Mini App, get an App/Zone ID.
2. Add their lightweight SDK script to `index.html` or load it dynamically in `ads/monetag.js`.
3. Ad placements:
   - **Rewarded interstitial**: shown on "Game Over" screen with a "Watch ad to continue / get bonus" button — only triggers on explicit user tap, never forced.
   - **Interstitial**: shown automatically after every 3rd completed game session (frequency-capped).
   - **Banner**: static placement on the Launcher screen only (not inside active gameplay, to avoid distracting from the game).
4. Wrap all ad calls in a small module so ad logic isn't duplicated per game:
   ```js
   // ads/monetag.js
   export async function showRewarded(onReward) { ... }
   export async function showInterstitial() { ... }
   export function renderBanner(containerId) { ... }
   ```
5. Track ad shown/reward events in Firestore (`analytics/{uid}/adEvents`) — optional, useful later for tuning frequency.

---

## 9. Game Modules

Each game is a self-contained React component with a consistent interface so the launcher can mount any of them the same way:

```jsx
<GameShell gameId="snake" onGameOver={(score) => saveScore('snake', score)}>
  <SnakeGame />
</GameShell>
```

`GameShell` handles: score submission to Firestore, triggering ad calls at game-over, and showing `GameOverModal` (with "Retry", "Watch ad for bonus", "Back to menu", and current leaderboard rank).

| Game | Complexity | Notes |
|---|---|---|
| Tic-Tac-Toe | Low | Good for testing pipeline first |
| Memory Match | Low | Simple grid + flip state |
| 2048 | Medium | Grid logic + swipe gestures |
| Snake | Medium | Canvas-based, needs game loop |
| Flappy-clone | Medium | Canvas-based, physics + collision |
| Quiz | Low-Medium | Needs a question bank (can be a static JSON file) |

Build order (easiest → hardest) is recommended for momentum: Tic-Tac-Toe → Memory Match → Quiz → 2048 → Snake → Flappy-clone.

---

## 10. Deployment

1. Push repo to GitHub.
2. Connect repo to Vercel or Cloudflare Pages — auto-deploys on every push to `main`, free tier includes generous bandwidth for this scale.
3. Deploy Firebase Cloud Function + Firestore rules via `firebase deploy` (Firebase CLI, free).
4. Register the deployed HTTPS URL as the Mini App URL in BotFather (`/newapp` or `/myapps`).
5. Set environment variables/secrets (bot token, Firebase config, Monetag app ID) via Vercel/Cloudflare's dashboard and Firebase Functions config — never commit secrets to the repo.

---

## 11. Performance Considerations

- Lazy-load each game module (`React.lazy` + `Suspense`) so the initial launcher bundle stays small — important since Telegram WebViews should feel instant.
- Keep Canvas-based games (Snake, Flappy) using `requestAnimationFrame`, not intervals, for smooth performance on low-end Android devices (majority of Telegram's user base).
- Preload the Monetag SDK asynchronously so it doesn't block initial render.

---

## 12. Testing Strategy

- Manual test matrix: Telegram Desktop, Telegram Android, Telegram iOS (WebView quirks can differ).
- Unit tests for game logic (win conditions, scoring) with Vitest.
- Manual QA checklist for ad frequency/UX before each release.
- Test Firestore rules with the Firebase Emulator Suite (free, local) before deploying.

---

## 13. Build Phases (Milestones)

| Phase | Deliverable |
|---|---|
| 1 | Bot registered, blank React app deployed and opening correctly inside Telegram |
| 2 | Telegram auth flow working end-to-end (initData → Cloud Function → Firebase custom token) |
| 3 | Launcher UI + Tic-Tac-Toe + Memory Match + Quiz, with Firestore score saving |
| 4 | 2048, Snake, Flappy-clone added |
| 5 | Leaderboard UI wired to Firestore |
| 6 | Monetag integrated (rewarded + interstitial + banner), frequency tuned |
| 7 | Share button, polish, soft launch to test groups |

---

## 14. Open Items to Confirm Before Coding

- Bot name/handle and app name (for BotFather registration).
- Visual style/theme direction (color palette, icon style) — can align with Telegram's light/dark theme variables automatically via `Telegram.WebApp.themeParams`.
- Quiz question bank source/topic.
