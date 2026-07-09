# PRD: Telegram Mini-Games Hub

**Version:** 1.0
**Date:** July 2026
**Owner:** [Your name]
**Budget target:** $0 (100% free stack)

---

## 1. Overview

A single Telegram Mini App that hosts multiple lightweight casual games (2048, Snake, Flappy-style, Quiz, Tic-Tac-Toe, Memory Match, etc.) inside one launcher screen. Users tap the bot, launch the app instantly (no install), pick a game, and play. Revenue comes from ad networks that specialize in Telegram Mini Apps (rewarded video, interstitials, banners) — no subscriptions or purchases required to start.

**Why it works:** Telegram has 1B+ monthly users, zero-friction access (no app store, no signup), and a mature ecosystem of free-to-integrate ad SDKs built specifically for Mini Apps.

---

## 2. Goals

- Launch a working multi-game Mini App with zero cash spend.
- Generate ad revenue from day one via rewarded/interstitial ads.
- Keep architecture simple enough for one person to build and maintain.
- Build a foundation that can later add leaderboards, more games, or Telegram Stars purchases.

**Non-goals (v1):** native iOS/Android apps, real-money gambling, multiplayer real-time games, crypto/token rewards.

---

## 3. Target Users

- Casual mobile gamers already inside Telegram (chat groups, channels).
- People looking for quick 2–5 minute time-killers (commute, breaks).
- Telegram channel/group admins who might share the app with their audience (organic growth).

---

## 4. Core Features (v1 scope)

| Feature | Description |
|---|---|
| Game launcher home screen | Grid of game icons, tap to open a game |
| 4–6 starter games | 2048, Snake, Tic-Tac-Toe, Memory Match, Flappy-clone, Quiz |
| Telegram login | Auto-identifies user via Telegram WebApp `initData` — no signup form |
| Score tracking | Local high score per game, stored per Telegram user ID |
| Ad integration | Rewarded interstitial between games / on "continue" or "extra life"; banner on home screen |
| Share button | "Share with friends" using Telegram's native share sheet (growth loop) |

**Deferred to v2:** global leaderboards, daily streak rewards, Telegram Stars in-app purchases, more games, push notifications via bot.

---

## 5. Monetization Plan (Free to Set Up)

| Method | Notes |
|---|---|
| **Rewarded interstitials** | Primary revenue driver. User watches a short ad voluntarily for a bonus (extra life, retry, coins). CTR on rewarded formats is much higher than passive display ads. |
| **Interstitial ads between games/levels** | Shown occasionally (e.g., after every 3rd game session) — cap frequency to avoid annoying users. |
| **Banner ad on home screen** | Passive, low-intrusion revenue. |
| **Ad network options (free to integrate, revenue-share model, no upfront cost):** Monetag, Adexium, RichAds, TADS. Each provides a lightweight JS SDK — you paste a script tag and app ID, no fees to join. |
| **Not recommended for v1:** Telegram's own official ad platform (min. budget $2,000–5,000, meant for buying ads, not for small publishers) |

**Recommendation:** Start with **one** ad network (e.g., Monetag or Adexium) for clean data, add a second later via mediation if needed.

Rule of thumb for pacing ads: no more than 1 interstitial per 3–5 minutes of play, so retention doesn't suffer.

---

## 6. Free Tech Stack

| Layer | Tool | Why free |
|---|---|---|
| Frontend (games + launcher) | Plain HTML/CSS/JavaScript (or lightweight framework like Vue/Preact) | No license cost; simple games don't need heavy frameworks |
| Telegram integration | Telegram WebApp JS SDK (`telegram-web-app.js`) | Free, just a script include |
| Bot creation | BotFather (Telegram) | Free, gives you a bot token in 2 minutes |
| Hosting | Cloudflare Pages, Vercel, Netlify, or GitHub Pages (all free tiers, auto-HTTPS) | Telegram Mini Apps require HTTPS — all of these give it free |
| Backend / bot webhook (optional, for score sync) | Cloudflare Workers free tier or Vercel serverless functions | Free tier covers a small app comfortably |
| Database (optional, for cross-device scores) | Supabase or Firebase free tier | Enough for thousands of users at no cost |
| Ad SDK | Monetag / Adexium / RichAds / TADS | Free to integrate, they pay you a revenue share |
| Version control | GitHub (free) | — |

**Total cost to launch: $0.** Ongoing cost stays $0 unless you outgrow free tiers (unlikely until tens of thousands of daily users).

---

## 7. User Flow

1. User opens bot in Telegram → taps "Play" button (a `WebApp` button).
2. Mini App opens inside Telegram → shows game grid.
3. User taps a game → game loads instantly (all games bundled in one app, no reload).
4. Mid-game or on game-over: rewarded ad offer ("Watch ad for extra life/coins") or periodic interstitial.
5. User can tap "Share" to send the app link to a friend or group.

---

## 8. Success Metrics

- Daily Active Users (DAU) and sessions per user.
- Average session length (target: 3–7 minutes, in line with TMA benchmarks).
- Ad impressions per session and eCPM.
- Retention: Day 1 / Day 7 return rate.
- Revenue per 1,000 users (RPM).

---

## 9. Build Plan (Phased, Solo-Friendly)

1. **Week 1:** Register bot via BotFather, set up Mini App URL, deploy a "Hello World" Mini App to free hosting, confirm it opens correctly in Telegram.
2. **Week 2:** Build launcher screen + first 2 games (start with the simplest: Tic-Tac-Toe, Memory Match).
3. **Week 3:** Add remaining games (2048, Snake, Quiz).
4. **Week 4:** Integrate one ad SDK (rewarded + interstitial + banner), test ad frequency/UX.
5. **Week 5:** Add share button, polish UI, soft-launch to a few Telegram groups for feedback.
6. **Ongoing:** Monitor ad revenue dashboard, tune ad placement/frequency, consider adding leaderboards or Stars purchases in v2.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Too many ads hurts retention | Cap frequency (1 interstitial per 3–5 min); make rewarded ads opt-in only |
| Low initial traffic | Share in relevant Telegram groups/channels; make the "Share" button prominent |
| Ad network payout thresholds | Some networks require min. payout ($10–50) — factor into cash-flow expectations |
| Free hosting tier limits | Unlikely to hit limits early; monitor usage, migrate if needed (still free options exist at higher tiers too) |

---

## 11. Open Questions

- Which 4–6 games to launch with first (can adjust based on what's fastest to build well)?
- Single ad network first, or mediation from day one?
- Do you want score persistence across devices (needs a backend+DB) or is local-only fine for v1?
