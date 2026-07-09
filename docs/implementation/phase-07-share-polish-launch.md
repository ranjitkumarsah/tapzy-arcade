# Phase 7 — Share, Polish & Soft Launch

**Goal:** Add the growth loop (Share button), polish the UI/UX, run the QA matrix, and soft-launch Tapzy Arcade to test groups.

**Depends on:** all prior phases.

---

## Tasks (Claude writes these as code)

1. **Share button** (`Launcher` + game-over):
   - Use Telegram's native share. Options:
     - `Telegram.WebApp.switchInlineQuery(...)` to share into a chat, or
     - A shareable deep link `https://t.me/<yourbot>/arcade?startapp=ref_<uid>` (sets up referral tracking for v2).
   - Make the button prominent (PRD: growth depends on it).
2. **Polish:**
   - Consistent theming across all screens using Telegram `themeParams` (already scaffolded Phase 1).
   - Loading skeletons / transitions between launcher and games.
   - Haptic feedback on key actions (`Telegram.WebApp.HapticFeedback`).
   - Empty/error states everywhere (offline, auth failure, ad unavailable).
   - App icon, launcher header/branding for "Tapzy Arcade".
3. **Unit tests (Vitest)** for game logic (win conditions, scoring) per TRD testing strategy.
4. Final performance pass: confirm initial launcher bundle is small (lazy-loading working), Monetag loads async.

---

## 🔧 Manual Steps (you do these)

### A. QA matrix (TRD §12)
Test on all three, checking each game, auth, scores, leaderboard, ads, share:
- **🔧 Telegram Desktop**
- **🔧 Telegram Android**
- **🔧 Telegram iOS**
Record any WebView-specific bugs and report to Claude.

### B. Polish assets in BotFather
- **🔧 MANUAL STEP** — In @BotFather, set a proper bot **profile picture**, **description**, and **about** text for Tapzy Arcade (`/setuserpic`, `/setdescription`, `/setabouttext`). Update the Mini App photo/GIF via `/myapps`.
- **🔧 MANUAL STEP** — Set the bot's **menu button** to launch the Mini App (`/setmenubutton` → your `arcade` URL) so users can open it from the chat.

### C. Soft launch
- **🔧 MANUAL STEP** — Share `https://t.me/<yourbot>/arcade` in a few relevant Telegram groups/channels you're part of. Ask for feedback on fun, ad frequency, and bugs.
- **🔧 MANUAL STEP** — Watch the **Monetag dashboard** (impressions/eCPM) and **Firebase usage** (stay within free tier) over the first days.

### D. Optional but recommended
- **🔧 MANUAL STEP** — Add the bot to Telegram's app directory / set up `/setcommands` (e.g., `/play`, `/help`) for discoverability.

---

## Files touched

```
src/components/Launcher.jsx      (modified — share button, branding)
src/components/GameOverModal.jsx (modified — share)
src/**                           (polish across screens)
tests/**                         (new — Vitest game-logic tests)
```

---

## Acceptance criteria

- [ ] Share button opens Telegram's native share flow with a working deep link.
- [ ] Consistent theming + haptics + graceful error states throughout.
- [ ] QA matrix passes on Desktop, Android, iOS.
- [ ] Vitest game-logic tests pass.
- [ ] BotFather assets (pic, description, menu button) set.
- [ ] Soft launched; feedback loop and dashboards being monitored.

**Est. effort:** ~3–5 days + ongoing monitoring.

---

## Post-launch / v2 backlog (not in v1)

Daily streak rewards · Telegram Stars purchases · more games · push notifications via bot · referral rewards (the `ref_<uid>` deep link is already seeded) · ad mediation (second network).
