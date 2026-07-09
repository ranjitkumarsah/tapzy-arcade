# Phase 1 — Telegram Integration

**Goal:** Wire the Telegram WebApp SDK properly so the app feels native inside Telegram: it expands to full height, adopts Telegram's light/dark theme, and displays the real logged-in user's name/avatar from `initDataUnsafe`.

**Depends on:** Phase 0 (bot + Mini App open successfully).

---

## Tasks (Claude writes these as code)

1. Create `src/telegram/initTelegram.js`:
   - Call `Telegram.WebApp.ready()` and `Telegram.WebApp.expand()` on load.
   - Read and export `initData` (raw string — for Phase 2 verification) and `initDataUnsafe` (parsed — display only).
   - Read `themeParams` and set CSS variables so the app matches Telegram's theme (background, text, button colors), including reacting to `themeChanged` events.
   - Gracefully handle running **outside** Telegram (normal browser during dev) — provide a mock user so local dev works.
2. Wire `App.jsx` to show the real user: `initDataUnsafe.user.first_name` + avatar if present.
3. Add a small `context/AppContext.jsx` holding `{ telegramUser, initData }` so later phases can consume it.
4. Use Telegram's `BackButton` API scaffold (show/hide) for future in-game navigation.
5. Confirm the app respects `viewportStableHeight` so layout doesn't jump when Telegram's UI chrome appears.

---

## 🔧 Manual Steps (you do these)

- **🔧 MANUAL STEP — Re-test in Telegram after deploy.** Push to `main`; Vercel auto-deploys. Reopen `https://t.me/<yourbot>/arcade` on **both** a phone and Telegram Desktop.
  - Confirm the app fills the screen (expanded).
  - Confirm your real first name shows.
  - Toggle your Telegram app between light/dark theme and reopen — the app colors should follow.

> There are no dashboard/signup steps in this phase — it's all code + testing.

---

## Files touched

```
src/telegram/initTelegram.js   (new)
src/context/AppContext.jsx     (new)
src/App.jsx                    (modified)
src/main.jsx                   (modified — wrap in provider)
src/styles/theme.css           (new — CSS vars)
```

---

## Acceptance criteria

- [ ] App auto-expands to full height inside Telegram.
- [ ] Real Telegram first name (and avatar if available) displays.
- [ ] App colors match Telegram light/dark theme and update when theme changes.
- [ ] App still runs in a normal browser during `npm run dev` (mock user), no crashes.
- [ ] `initData` raw string is available in context for Phase 2.

**Est. effort:** ~2–4 hours.
