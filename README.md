# Tapzy Arcade

A Telegram Mini App hosting a hub of casual mini-games (Tic-Tac-Toe, Memory Match, Quiz, 2048, Snake, Flappy-clone). React + Vite frontend, Firebase (Firestore + Auth) backend, Monetag ads. 100% free stack, no credit card required.

- Product/tech specs: [`docs/`](docs/)
- Build plan (phase by phase): [`docs/implementation/IMPLEMENTATION-PLAN.md`](docs/implementation/IMPLEMENTATION-PLAN.md)

## Local development

```bash
npm install
npm run dev        # http://localhost:5173  (also served on your LAN IP for phone testing)
```

Outside Telegram you'll see a "Not running inside Telegram" notice — that's expected. Open the app through your bot to test the Telegram integration.

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Environment variables

Copy `.env.example` to `.env` and fill values as each phase needs them (Firebase in Phase 2, Monetag in Phase 6). Server-side secrets (`TELEGRAM_BOT_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`) are set **only** in the Vercel dashboard — never in the repo.

## Deployment

Auto-deploys to Vercel on every push to `main` (free Hobby tier, HTTPS). The Telegram auth function lives in `api/` as a Vercel serverless function (added in Phase 2).

## Status

**Phase 0** — project skeleton + bot registration. See the implementation plan for what's next.
