# V2 Phase 3 — Referral Rewards

**Goal:** Turn the existing share link into growth: when a new user joins via someone's referral link, **both** get coins — with abuse protection.

**Depends on:** P1 (coins). The `?startapp=ref_<uid>` link is already seeded in v1's share button.

---

## Tasks (Claude writes as code)

1. **Capture the referrer**
   - On first launch, read `initDataUnsafe.start_param` (the `ref_<uid>` from `startapp`).
   - Send it to the server during auth/first-login; store `referrals/{newUid}.referredBy = <refUid>` **once** (never overwritten).
2. **`api/claimReferral.js`** (server-authoritative):
   - Credits the **invitee** a signup bonus and the **referrer** a reward — but only after an **anti-fraud qualification** (e.g., invitee reaches a small activity threshold: played N games / watched 1 ad), to stop throwaway accounts.
   - Idempotent per referred uid; a user can be referred only once; self-referral and referrer==invitee blocked.
3. **UI**
   - "Invite friends → earn coins" screen with the personal link, a copy button, and Telegram share.
   - Referral stats: invited count, coins earned, pending (not yet qualified).
4. **Anti-abuse:** cap referrals/day, detect loops/self-referral, require invitee qualification, server-only crediting.

---

## 🔧 Manual Steps

- **🔧 Decide referral rewards** (referrer + invitee amounts) and the **qualification threshold** with Claude. Recommended: referral coins are **bonus/soft coins** (in-app only) unless you accept the extra fraud exposure of withdrawable referral cash.

---

## Acceptance criteria

- [ ] Opening the app via a ref link records `referredBy` once.
- [ ] Referrer + invitee credited only after qualification; logged in ledger.
- [ ] Self-referral, double-referral, and loops are blocked.
- [ ] Referral stats display correctly.

**Est. effort:** ~3–4 days.
