# V2 Phase 8 — Withdrawable Coins & Payouts (LAUNCH LAST)

**Goal:** Let users **cash out** their withdrawable (ad-earned) coins to real money, with strict reward-pool accounting, fraud controls, and a payout rail. This is the highest-risk phase — build it last, after the economy is proven.

**Depends on:** P0–P4 (economy, fraud signals, referrals) and P7 (helps monetization balance).

---

## Prerequisites (must be true before enabling withdrawals)

- **🔧 Ad-policy confirmed** (from P0): your ad/offerwall network permits paying users real cash.
- **🔧 Payout rail chosen**: Telegram Stars can't pay users out — pick one: **crypto (USDT/TON)**, **PayPal**, or **gift cards**. Note fees, minimums, and regional availability.
- **🔧 Fraud controls live** (from earlier phases): per-day caps, device/velocity checks, referral qualification.
- **🔧 Legal/compliance review**: cash rewards may trigger local regulations, tax reporting, minimum-age, and T&C requirements. Add Terms, region gating, and record-keeping. Consult local rules for your market.

---

## Tasks (Claude writes as code)

1. **Two-balance model** (finalize): `earnedCoins` (from verified ad watches → **withdrawable**) vs `bonusCoins` (daily/referral/etc → **in-app only**). Only `earnedCoins` can be withdrawn.
2. **`api/withdraw/request.js`** (server-authoritative, transactional):
   - Checks minimum threshold, KYC/limits, fraud score, and that `rewardPool.paidToDate + amount ≤ 50% of realized net revenue`.
   - Debits `earnedCoins` atomically, creates `withdrawals/{id}` with status `pending`, logs ledger.
3. **Reward-pool ledger**: reconcile ad revenue → pool; withdrawals draw from `paidToDate`. Never allow total payouts to exceed the pool.
4. **Review/queue**: withdrawals default to **manual review** (or rules-based auto-approve for low-risk, small amounts) → `approved`/`rejected` → payout executed → `paid`.
5. **Payout execution**: integrate the chosen rail (start **manual/semi-automated** payouts to reduce risk; automate later).
6. **Withdrawal UI**: balance (withdrawable vs bonus), threshold, request form (method + details), history/status, clear T&C.
7. **Anti-fraud hardening**: velocity limits, duplicate-account detection, hold periods, clawback on detected fraud.

---

## 🔧 Manual Steps

- **🔧 Choose + set up payout rail** (crypto wallet / PayPal business / gift-card API) and add credentials to Vercel env (server-side only).
- **🔧 Set thresholds & limits** (min withdrawal, daily/max caps, hold period) with Claude — start conservative.
- **🔧 Publish Terms & privacy** covering rewards, eligibility, region/age, and anti-fraud clawback.
- **🔧 Dry-run** a full withdrawal in staging with test amounts before enabling for users.
- **🔧 Start with manual approval** for the first cohort; watch for fraud patterns before automating.

---

## Acceptance criteria

- [ ] Only `earnedCoins` (verified ad watches) are withdrawable; bonus coins are not.
- [ ] Total payouts can never exceed 50% of realized net revenue (pool-gated).
- [ ] Withdrawal debits atomically, creates an auditable record, and can't double-spend.
- [ ] Fraud controls + review queue in place; payouts execute via the chosen rail.
- [ ] Terms/region/age gating live.

**Est. effort:** ~2–3 weeks (plus external: rail setup, legal, review process).

> ⚠️ Real money = real liability. Do not enable withdrawals until idempotency, transactions, ledger reconciliation, fraud controls, and pool accounting are all verified in staging.
