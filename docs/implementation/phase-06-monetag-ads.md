# Phase 6 — Monetag Ad Integration

**Goal:** Earn revenue via Monetag: opt-in **rewarded** interstitial (game-over "watch for bonus"), automatic **interstitial** (frequency-capped), and a **banner** on the launcher. All ad logic lives in one module so the network can be swapped later.

**Depends on:** Phase 3 (GameShell + game-over flow).

---

## Prerequisites

- **🔧 MANUAL STEP — Monetag account** — https://monetag.com. Sign up (free), then add your Mini App / site and create ad zones. You'll get a **Zone ID** (and possibly an SDK snippet).

---

## Tasks (Claude writes these as code)

1. `src/ads/monetag.js` — single wrapper module exporting:
   - `initMonetag()` — loads the Monetag SDK asynchronously (non-blocking, per TRD performance note).
   - `showRewarded(onReward)` — resolves/calls `onReward` only if the user actually completed the ad.
   - `showInterstitial()` — shows a full-screen interstitial.
   - `renderBanner(containerId)` — mounts a banner into a container.
   - All functions **no-op gracefully** if the SDK failed to load or `VITE_MONETAG_ZONE_ID` is missing (so the app never breaks when ads are unavailable, e.g. local dev).
2. **Frequency capping** in `AppContext`:
   - Count completed game sessions; show an interstitial after **every 3rd** session.
   - Enforce **no more than 1 interstitial per ~3–5 minutes** (timestamp guard).
3. Wire into `GameOverModal`:
   - "▶️ Watch ad for bonus/retry" button → `showRewarded` → grant the bonus (extra life / retry / bonus points) only on completion.
   - After closing the modal, maybe fire `showInterstitial()` if the frequency cap allows.
4. Wire `renderBanner` into the **Launcher only** (never during active gameplay).
5. (Optional) Log ad shown/reward events to `analytics/{uid}/adEvents` for later tuning.

---

## 🔧 Manual Steps (you do these)

### A. Monetag setup
1. Create the account and verify email.
2. Add your Mini App URL (`https://t.me/<yourbot>/arcade` and/or the Vercel URL) as a property.
3. Create ad zones for the formats you're using (rewarded interstitial, interstitial, banner). **Copy each Zone ID.**
4. Give Claude the Zone ID(s). Add `VITE_MONETAG_ZONE_ID` in **Vercel → Environment Variables** and local `.env`.

### B. Test the ad flow
1. Push to `main`, open in Telegram.
2. On game over, tap "Watch ad for bonus" → confirm an ad plays and the bonus is granted only after it finishes.
3. Play 3 sessions → confirm an interstitial appears, and that it does **not** reappear within a few minutes.
4. Confirm the banner shows on the launcher and **not** during gameplay.

> **Payout note:** Monetag has a minimum payout threshold and a payment method setup (PayPal/crypto/wire). Set your payout method in the Monetag dashboard when convenient — not required to start showing ads.

> **UX guardrail (from PRD):** rewarded ads are always opt-in; interstitials capped at ~1 per 3–5 min. If testers complain about ad frequency, tell Claude and we'll loosen the cap.

---

## Files touched

```
src/ads/monetag.js               (new)
src/context/AppContext.jsx       (modified — frequency counters)
src/components/GameOverModal.jsx (modified — rewarded button)
src/components/Launcher.jsx      (modified — banner)
index.html or monetag.js         (SDK load)
.env.example                     (modified — VITE_MONETAG_ZONE_ID)
```

---

## Acceptance criteria

- [ ] Rewarded ad plays only on explicit tap; bonus granted only on completion.
- [ ] Interstitial shows after every 3rd session, capped to ~1 per 3–5 min.
- [ ] Banner shows on launcher only.
- [ ] App works fully even if the ad SDK fails to load (graceful no-op).
- [ ] No Monetag ID committed to the repo.

**Est. effort:** ~2–3 days (much of it testing ad behavior on real devices).
