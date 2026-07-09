# Phase 2 — Firebase Setup & Telegram Auth (100% free, no card)

**Goal:** Auto-identify the user with a real Firebase Auth session tied 1:1 to their Telegram ID — no login form. Client sends raw `initData` → a **Vercel serverless function** verifies the Telegram signature → mints a Firebase custom token → client signs in. Firestore rules lock private data to the owner.

> **Why not Firebase Cloud Functions?** They now require Firebase's **Blaze** plan (a credit card on file). You asked for 100% free with **no card**, so the auth function runs as a **Vercel Serverless Function** on the free Hobby tier instead. Firebase **Firestore** and **Auth** stay on the free **Spark** plan — neither needs a card. Custom-token minting is done with the Firebase **Admin SDK** inside the Vercel function (it just signs a token locally with a service-account key — no billing, no outbound quota).

**Depends on:** Phase 1 (raw `initData` available in context).

---

## Prerequisites

- **🔧 MANUAL STEP — Firebase account** — https://console.firebase.google.com (free "Spark" plan, no card).
- Vercel account (already created in Phase 0). The serverless function deploys automatically with your repo — no extra service.
- **🔧 MANUAL STEP — Firebase CLI (optional)** — only used to push Firestore rules (`npm install -g firebase-tools`, `firebase login`). You can alternatively paste rules in the console by hand (see Step D) to skip the CLI entirely.

---

## Tasks (Claude writes these as code)

1. `src/firebase/firebaseConfig.js` — initialize Firebase app + Auth + Firestore from `VITE_FIREBASE_*` env vars (public client config).
2. `api/verifyTelegramAuth.js` — **Vercel serverless function** (Node runtime):
   - Receives `initData` string (POST body).
   - Recomputes HMAC-SHA256 hash using the bot token (from `TELEGRAM_BOT_TOKEN` env var) per Telegram's spec; compares to the provided `hash`.
   - Rejects if `auth_date` older than 24h (replay protection).
   - On success, uses **Firebase Admin SDK** (initialized from `FIREBASE_SERVICE_ACCOUNT` env var) to mint a Firebase **custom token** for UID `tg_<telegram_user_id>`; returns it plus basic profile fields.
   - Uses CORS-safe handling; only accepts POST.
3. `api/package.json` (or root deps) — add `firebase-admin` so the function can mint tokens.
4. `src/telegram/useTelegramAuth.js` — hook that POSTs `initData` to `/api/verifyTelegramAuth`, then `signInWithCustomToken()`, and upserts the `users/{uid}` doc (firstName, username, createdAt, lastSeen).
5. `firestore.rules` — per the TRD draft (users/scores private to owner; leaderboard readable by all, writable by owner with a numeric score).
6. `firebase.json`, `.firebaserc` — config for the **Firestore rules deploy only** (no functions). Free.
7. Wire auth into `AppContext` so the rest of the app can await "authenticated" state; add a loading state while auth resolves.

---

## 🔧 Manual Steps (you do these)

### A. Create the Firebase project (free, no card)
1. Firebase Console → **Add project** → name it `tapzy-arcade` → you can disable Google Analytics.
2. **Build → Authentication → Get started** (enabling Authentication once is enough for custom tokens to work).
3. **Build → Firestore Database → Create database → Production mode** → pick a region near your users. This stays on the free **Spark** plan; do **not** upgrade to Blaze.

### B. Register a Web App & get the public config
1. Project settings (gear) → **Your apps** → add a **Web** app → register.
2. Copy the `firebaseConfig` values.
3. Give these to Claude for local `.env`, and add them in **Vercel → Project → Settings → Environment Variables** as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

### C. Get a service-account key (lets the Vercel function mint tokens)
1. Firebase Console → Project settings → **Service accounts** tab → **Generate new private key** → downloads a JSON file.
2. Open the JSON, copy its **entire contents**.
3. In **Vercel → Settings → Environment Variables**, add:
   - `TELEGRAM_BOT_TOKEN` = your bot token from Phase 0 (**no** `VITE_` prefix).
   - `FIREBASE_SERVICE_ACCOUNT` = paste the whole JSON as the value (**no** `VITE_` prefix).
   - Mark both for the **Production** (and Preview) environments.
4. **Never commit the JSON file.** Delete the downloaded file after pasting, or keep it outside the repo. `.gitignore` already excludes `.env`.

### D. Deploy the Firestore rules
- **Option 1 (CLI):** `firebase deploy --only firestore:rules` (Claude provides this).
- **Option 2 (no CLI):** Firebase Console → Firestore → **Rules** tab → paste the contents of `firestore.rules` → **Publish**.

### E. Test end-to-end
1. Push to `main` (Vercel redeploys the app **and** the `/api` function) → open the Mini App in Telegram.
2. Firebase Console → **Authentication → Users**: confirm a user `tg_<yourid>` appears after opening the app.
3. **Firestore → Data**: confirm a `users/tg_<yourid>` document was created.
4. If it fails, check the Vercel function logs: **Vercel → your project → Deployments → latest → Functions** → view `verifyTelegramAuth` logs.

> There is **no Blaze prompt** anywhere in this flow. If any Firebase screen asks you to upgrade/add a card, you don't need it — stop and tell Claude.

---

## Files touched

```
src/firebase/firebaseConfig.js   (new)
src/telegram/useTelegramAuth.js  (new)
api/verifyTelegramAuth.js        (new — Vercel serverless function)
api/package.json / root deps     (new — firebase-admin)
firestore.rules                  (new)
firebase.json / .firebaserc      (new — rules deploy only)
src/context/AppContext.jsx       (modified)
.env.example                     (modified — document Firebase keys; server keys noted as Vercel-only)
```

---

## Acceptance criteria

- [ ] Opening the app in Telegram creates a `tg_<id>` Firebase Auth user automatically.
- [ ] A `users/{uid}` doc is created/updated with correct profile fields.
- [ ] Tampering with `initData` (or an expired `auth_date`) is **rejected** by the function.
- [ ] Firestore rules deployed; a user cannot read another user's private score doc.
- [ ] Everything is on free tiers with **no credit card** (Firebase Spark + Vercel Hobby).
- [ ] No bot token or service-account JSON anywhere in the repo or client bundle.

**Est. effort:** ~1 day (function + rules + dashboard setup).
