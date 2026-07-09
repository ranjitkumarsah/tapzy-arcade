# V2 Phase 1 — Coins: Earn & Spend

**Goal:** Make coins visible and useful. Show the wallet, let players **earn** coins from verified rewarded-ad watches, and **spend** them on in-game perks (extra life, retry, continue) — all through the server-authoritative economy from P0.

**Depends on:** P0 (wallet/ledger, `adReward`, `spend` lib).

---

## Tasks (Claude writes as code)

1. **Wallet UI**
   - Coin balance chip in the launcher header (live from `wallets/{uid}`).
   - A small **Wallet** panel: balance, "how to earn" (watch ads), recent ledger entries.
2. **Earn flow**
   - "▶️ Watch ad → earn coins" entry points (launcher + game-over). Client calls Monetag rewarded; **the actual coin credit comes from the server S2S postback**, not the client. Client just reflects the balance update (poll/live-read).
   - Show the credited amount when the balance increases.
3. **Spend flow** (`api/spend.js` + `src/economy/spend.js`)
   - Perks: **Extra life / Continue** (Snake, Flappy, 2048, Memory), **Quiz 50:50 or skip**, **Retry without losing streak**.
   - Spending is an atomic server transaction (can't go negative); client shows result.
   - `GameShell` exposes a "Continue for N coins" option on game-over alongside the rewarded-ad option.
4. **Balance safety in UI:** never trust client balance for decisions — the server validates on spend; UI is optimistic then reconciles.

---

## 🔧 Manual Steps

- **🔧 Decide perk prices** (coins) with Claude — e.g., continue = X coins; keep them meaningful vs earn rate.
- **🔧 Test earn** with a real rewarded ad → confirm the S2S postback credits the balance within a few seconds.

---

## Acceptance criteria

- [ ] Wallet balance shows and updates after an ad-reward postback.
- [ ] Spending a perk deducts coins atomically and applies the perk in-game.
- [ ] Spending more than the balance is rejected by the server.
- [ ] Earning is impossible without a valid server postback (client can't self-credit).
- [ ] Ledger reflects every earn/spend.

**Est. effort:** ~4–6 days.
