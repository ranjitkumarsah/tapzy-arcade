# 🎮 Tapzy Arcade — Telegram Mini-Games Hub
### A complete, revenue-ready Telegram Mini App — source code for sale

Launch your own **arcade + rewards platform** on Telegram in days, not months.
11 polished games, a full **watch-to-earn coin economy**, **Telegram Stars**
payments, ads, referrals, daily rewards, and leaderboards — all running on a
**$0/month, no-credit-card** infrastructure.

> Telegram has **1B+ monthly users** and zero-friction access — no app store, no
> installs, no signup. Users tap your bot and play instantly.

---

## 📸 Screenshots

> Replace these with real captures from your phone (drop PNGs into
> [`docs/screenshots/`](screenshots/) — see the [capture guide](screenshots/README.md)).

| Launcher | Gameplay | Daily Spin |
|---|---|---|
| ![Launcher](screenshots/launcher.png) | ![Gameplay](screenshots/game.png) | ![Daily Spin](screenshots/daily.png) |

| Wallet & Earn | Store (Stars) | Leaderboard |
|---|---|---|
| ![Wallet](screenshots/wallet.png) | ![Store](screenshots/store.png) | ![Leaderboard](screenshots/leaderboard.png) |

*(A 15–30s screen-recording GIF of the launcher → a game → a win with confetti sells
best — add it as `screenshots/demo.gif`.)*

---

## 💡 Why this is valuable

- **Ready to earn** — three monetization streams wired in: **ads** (Monetag),
  **Telegram Stars** (in-app purchases), and an **engagement/rewards loop** that
  drives ad views and retention.
- **Zero infra cost** — runs entirely on free tiers (Vercel + Firebase). No servers
  to manage, no monthly bill until you scale to tens of thousands of daily users.
- **Not a prototype** — server-authoritative economy, atomic + idempotent money
  handling, security rules, unit tests, and a full go-live checklist. Production-grade.
- **Fast to rebrand & ship** — change the name, colors, and bot; you're live.
- **Extensible by design** — every game is a self-contained module; add more in hours.

---

## 🕹️ What's inside

### 11 games (all touch-first, leaderboard-ready)
Tic-Tac-Toe · Memory Match (levels) · Quiz (50-question bank) · 2048 · Snake ·
Flappy · Reaction Test · Whack-a-Mole · Simon · Color Match · **Bubble Shooter**.

### A complete rewards economy
- **Watch-to-earn coins** — users earn coins by watching rewarded ads; balances are
  **withdrawable** (real-money cash-out) and fully server-verified.
- **Daily Spin-the-Wheel + streaks** — a daily habit loop that brings players back.
- **Referrals** — invite friends via a deep link; both sides earn (anti-abuse built in).
- **Profile, XP, levels & badges** — progression and status to boost retention.
- **In-game perks** — spend coins to "Continue" and keep your score.

### Monetization, three ways
1. **Ads** — Monetag rewarded + interstitial, frequency-capped for retention.
2. **Telegram Stars** — sell **Remove Ads**, **coin packs**, and **premium themes**;
   payments verified server-side.
3. **Engagement economy** — the coin loop maximizes voluntary ad views.

### Polish that sells
Animated splash · confetti & celebrations · animated counters · synthesized per-game
music + haptics · automatic light/dark theming · smooth transitions · reduced-motion
support.

---

## 🧱 Tech highlights (buyer due-diligence)

| Area | What you get |
|---|---|
| Frontend | React 18 + Vite, code-split, lazy-loaded games — fast cold start |
| Backend | 10 Vercel serverless functions (`/api`) — no server ops |
| Data/Auth | Firebase Firestore + Auth, auto Telegram sign-in (no signup UI) |
| Economy | **Server-authoritative**: atomic transactions, idempotency keys, double-entry ledger, reward-pool accounting |
| Security | Money collections are server-write-only; ad credit requires Monetag **S2S postback** (no client self-crediting); ID-token-verified spends/payments |
| Payments | Telegram Stars (Bot Payments API), server-verified entitlements |
| Withdrawals | Manual-approval flow with clawback + owner admin endpoint |
| Audio | Web Audio API — **zero binary assets** to host |
| Quality | Vitest test suite; documented PRD/TRD, phase plans, and go-live checklist |

**Cost to run:** $0 on free tiers (Vercel Hobby + Firebase Spark). Scales cheaply.

---

## 📦 What the buyer receives

- Full **source code** (frontend + serverless backend + security rules)
- **Documentation**: PRD, TRD, phased build plan, architecture in the README, and a
  step-by-step **go-live checklist** (env vars, rules, webhook, BotFather, QA)
- **Setup guidance** to deploy your own instance (Telegram bot, Firebase, Vercel, Monetag)
- 11 working games + reusable `GameShell` to add more

---

## ⚙️ Setup effort

With accounts in hand (Telegram, Firebase, Vercel, Monetag — all free), a technical
buyer can rebrand and deploy a live instance by following the checklist. No custom
servers, no paid dependencies.

---

## 🎯 Ideal for

- Indie developers / studios wanting a **turnkey Telegram game platform**
- Marketers/communities monetizing a Telegram audience
- Anyone building a **play-and-earn** or rewards app who wants a proven, secure base

---

## ⚠️ Honest notes (please read)

- **Revenue is not guaranteed.** Earnings depend on traffic, geography, ad fill/eCPM,
  and engagement. This is software, not an income promise.
- **Withdrawals / cash rewards** ship in **manual-approval mode**. Before paying users
  real money you must: confirm your **ad network permits incentivized/cash-for-views**
  traffic, connect a **payout rail** (crypto/PayPal/gift cards), and handle
  **legal/tax/region/age** requirements for your market. These are operational/legal
  responsibilities of the operator.
- **Third-party accounts** (Telegram, Firebase, Vercel, Monetag) are the buyer's own,
  under those providers' terms.

---

## 📜 License & sale terms (template — customize before selling)

> This is a starting template, **not legal advice**. Adjust to your deal and, for
> higher-value sales, have a lawyer review. Pick the model that matches what you're
> offering.

**What the buyer gets**
- The **full source code** and documentation in this repository, as-is at the time of sale.
- The right to **deploy their own instance** under **their own** Telegram bot, Firebase,
  Vercel, and ad-network accounts, and to **modify and rebrand** it freely.

**Choose a sale model** (delete the ones that don't apply):
- **Non-exclusive license** — you may resell the same code to other buyers. *(Lower price; most common.)*
- **Exclusive license** — you agree not to resell it to anyone else after this sale. *(Higher price.)*
- **Full ownership transfer** — buyer receives all rights; seller retains none and stops distributing it. *(Highest price.)*

**Not included / buyer's responsibility**
- Third-party accounts and any fees (Telegram, Firebase, Vercel, Monetag) — the buyer's own,
  under those providers' terms.
- **Compliance & legal**: incentivized-ads policy, real-money withdrawals, payouts, taxes,
  age/region gating, privacy, and Telegram/ad-network terms are the **operator's**
  responsibility.
- The seller's own live bot, users, data, ad-network earnings, or accounts are **not**
  transferred.

**No warranty / no income guarantee**
- Software is provided **"as is"**, without warranty of any kind. **Revenue is not
  guaranteed** and depends on traffic, geography, ad fill/eCPM, and engagement. To the
  maximum extent permitted by law, the seller is not liable for any damages or losses
  arising from use of the code.

**Support** *(state clearly)*: e.g. "Includes setup guidance via the go-live checklist;
[N days] of email support for deployment questions; no ongoing development included."

---

## 📈 The opportunity in one line

A **$0-infrastructure**, secure, extensible Telegram game platform with **built-in
ads, payments, and a withdrawable rewards economy** — rebrand it and start growing an
audience on the world's fastest-growing app ecosystem.

*Built with React, Firebase, and Telegram's Mini App + Stars platforms.*
