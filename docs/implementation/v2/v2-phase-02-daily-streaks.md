# V2 Phase 2 — Daily Streaks & Rewards

**Goal:** Bring players back every day with a daily bonus, a streak multiplier, and a spin-the-wheel — all paying coins, all server-verified.

**Depends on:** P1 (coins earn/spend).

---

## Tasks (Claude writes as code)

1. **`api/claimDaily.js`** (server-authoritative):
   - Uses server time (not client) to decide if today's claim is available.
   - Tracks `streaks/{uid}` = `{ current, longest, lastClaimDate }`; consecutive days increase `current`, a missed day resets it.
   - Credits a base daily reward × streak multiplier (capped); idempotent per calendar day.
2. **Spin-the-wheel** (optional within this phase):
   - Server rolls the reward (never client) among coin tiers; one free spin/day, extra spins via rewarded ad.
3. **UI**
   - Daily reward modal on launch when a claim is available ("Day N streak! +X coins").
   - A calendar/streak strip showing progress and next milestone.
   - Wheel animation (result comes from server; animation just lands on it).
4. **Anti-abuse:** all timing/reward decisions server-side; device clock changes can't help.

---

## 🔧 Manual Steps

- **🔧 Set reward curve** (base daily, multiplier per streak day, milestone bonuses) with Claude — keep within the reward-pool philosophy for coins that are withdrawable vs. bonus/soft coins (decide if daily coins are withdrawable or "soft" — recommended: daily/spin give **soft coins** usable in-app only, to protect the cash pool; only **ad-watch coins are withdrawable**).

> **Design note:** consider **two coin types** — `earnedCoins` (from ads, withdrawable) and `bonusCoins` (daily/spin/referral, spendable in-app only). This keeps withdrawal liability tied strictly to real ad revenue. Confirm with Claude which rewards are which.

---

## Acceptance criteria

- [ ] Daily claim works once per server-day; streak increments/resets correctly.
- [ ] Rewards credited server-side and logged in the ledger.
- [ ] Spin gives a server-decided reward; free/day enforced.
- [ ] Changing device clock does not grant extra claims.

**Est. effort:** ~3–5 days.
