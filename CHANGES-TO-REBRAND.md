# ⚡ Rebrand in 2 Minutes

The fast checklist to make this app *yours*. For the full launch walkthrough
(accounts, Firebase, Vercel, ads, payments) see **[docs/HANDOVER.md](docs/HANDOVER.md)**.

There are only **4 edits**. Do them, then redeploy.

---

## 1. `src/appConfig.js` — the one file that controls branding

```js
export const APP_NAME = 'Tapzy Arcade'            // → your app name
export const APP_TAGLINE = 'Tap · Play · Compete' // → your tagline
export const BOT_USERNAME = 'TapzyArcadeBot'      // → your bot username (no @)
export const APP_SHORT_NAME = 'arcade'            // → your Mini App short name
export const SHARE_TEXT = `Play free mini games on ${APP_NAME}! 🎮`
```

This drives the splash screen, every share message, and all deep links.

## 2. `index.html` — line 6

```html
<title>Tapzy Arcade</title>   <!-- → your app name -->
```

## 3. `package.json` — lines 2 & 6

```json
"name": "tapzy-arcade",
"description": "Tapzy Arcade — a Telegram Mini App hub of casual games.",
```

## 4. `public/logo.png` (optional)

Drop in your own square logo (~512×512). It shows on the splash screen.
Colors auto-match Telegram's light/dark theme — no edit needed unless you want a
custom accent (`src/styles/theme.css` → `--accent`).

---

## Then

```bash
git add -A && git commit -m "Rebrand" && git push
```

Vercel auto-redeploys. Hard-reopen the Mini App in Telegram to see the new name.

> `BOT_USERNAME` / `APP_SHORT_NAME` come from BotFather — set those after you've
> created your bot (see HANDOVER.md §4).
