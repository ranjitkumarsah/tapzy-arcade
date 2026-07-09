# Phase 0 — Project Setup & Bot Registration

**Goal:** A Vite + React skeleton that deploys to a free HTTPS host and opens as a Mini App inside Telegram, launched from a registered bot. This is the "Hello World" foundation.

**Depends on:** nothing.

---

## Prerequisites (accounts you need — all free)

Create these first if you don't have them:

- **🔧 MANUAL STEP — GitHub account** — https://github.com (for the repo + auto-deploy).
- **🔧 MANUAL STEP — Vercel account** — https://vercel.com, sign up with GitHub (for hosting).
- A Telegram account on your phone (for BotFather + testing).

---

## Tasks (Claude writes these as code)

1. Initialize a Vite React project (`npm create vite@latest` → React, JavaScript).
2. Set the app title to **Tapzy Arcade** in `index.html`.
3. Add the Telegram WebApp SDK script tag to `index.html`:
   `<script src="https://telegram.org/js/telegram-web-app.js"></script>`
4. Create a minimal `App.jsx` that renders "Tapzy Arcade — Hello World" and shows whether it detects the Telegram WebApp object (`window.Telegram?.WebApp`).
5. Add `.gitignore` (node_modules, `dist`, `.env`, `.firebase`).
6. Add `.env.example` (empty placeholders, documented in the master plan).
7. Add a short `README.md` with local-dev and deploy instructions.
8. Verify local build works (`npm run dev`, `npm run build`).

---

## 🔧 Manual Steps (you do these — Claude cannot)

### A. Push the repo to GitHub
1. Create a new **empty private** repo on GitHub named `tapzy-arcade`.
2. In the project folder run the git commands Claude provides (`git init`, add remote, push). *(Ask Claude to output the exact commands for your repo URL.)*

### B. Deploy to Vercel
1. Go to https://vercel.com/new → **Import** the `tapzy-arcade` GitHub repo.
2. Framework preset: **Vite**. Build command `npm run build`, output dir `dist` (Vercel auto-detects).
3. Click **Deploy**. Copy the production URL (e.g. `https://tapzy-arcade.vercel.app`).
4. Open that URL in a normal browser — you should see "Tapzy Arcade — Hello World".

### C. Register the bot in BotFather
1. In Telegram, open **@BotFather** → send `/newbot`.
2. Set a display name: **Tapzy Arcade**.
3. Set a username: try **`TapzyArcadeBot`**. If taken, try `TapzyArcadeGamesBot`, `PlayTapzyBot`, etc. **Write down the exact handle you get** — you'll need it everywhere. BotFather confirms availability instantly.
4. **Copy the bot token** BotFather gives you (looks like `123456:ABC-DEF...`). Keep it secret — you'll use it in Phase 2. Do **not** paste it into any file in the repo.

### D. Create the Mini App and attach the URL
1. In BotFather send `/newapp` → choose your bot.
2. Title: **Tapzy Arcade**. Short name (URL slug): **`arcade`**.
3. Description, photo (512×512), and demo GIF: you can use placeholders now, polish in Phase 7.
4. When asked for the **Web App URL**, paste your Vercel production URL from step B.
5. BotFather gives you a direct link: `https://t.me/<yourbot>/arcade`.

### E. Confirm it opens inside Telegram
1. Open `https://t.me/<yourbot>/arcade` on your phone → tap **Launch**.
2. You should see "Tapzy Arcade — Hello World" **and** the Telegram-detection line should say the WebApp object was found.

> **Tell Claude the results:** your final bot handle, the Vercel URL, and whether step E worked. Claude needs the handle for later phases (share links, etc.).

---

## Files touched

```
index.html · package.json · vite.config.js · src/main.jsx · src/App.jsx
.gitignore · .env.example · README.md
```

---

## Acceptance criteria

- [ ] `npm run dev` shows the page locally.
- [ ] Vercel production URL loads the page over HTTPS.
- [ ] `https://t.me/<yourbot>/arcade` opens the Mini App inside Telegram.
- [ ] The in-app line confirms `window.Telegram.WebApp` exists.
- [ ] No bot token or secret is present anywhere in the repo.

**Est. effort:** ~2–3 hours (mostly account setup + BotFather).
