# V2 Phase 7 — Telegram Stars (Remove Ads + Premium)

**Goal:** Add real-money income via **Telegram Stars**: sell **Remove Ads**, **premium themes/skins**, and optional **coin packs (soft coins)** — with server-verified entitlements.

**Depends on:** P1 (economy/entitlements). Independent of withdrawals.

---

## Background

Telegram Stars are Telegram's in-app currency for digital goods. Bots sell items via the Bot Payments API using Stars (`XTR` currency): create an invoice, the user pays in Stars, Telegram confirms via webhook. Stars are **inbound** (users pay you); they are **not** a way to pay users out (that's the withdrawal phase, via an external rail).

---

## Tasks (Claude writes as code)

1. **Products** (`api/_lib/products.js`): `remove_ads` (permanent), `theme_*` (cosmetic unlocks), `coins_*` (soft-coin packs). Prices in Stars.
2. **`api/stars/createInvoice.js`**: creates a Telegram Stars invoice link (`createInvoiceLink`, currency `XTR`) for a product; returns it to the client.
3. **Client checkout**: `Telegram.WebApp.openInvoice(link, callback)` → handle `paid`/`cancelled`/`failed`.
4. **`api/stars/webhook.js`** (Bot webhook or serverless): handle `pre_checkout_query` (answer OK) and `successful_payment`; **verify** and **grant the entitlement server-side** (idempotent by charge id): set `profiles/{uid}.entitlements.noAds = true`, unlock theme, or credit soft coins.
5. **Enforce entitlements**
   - Ads module checks `noAds` (server-provided) and shows **no ads** for payers (rewarded earning still optional if they choose).
   - Theme unlocks gate premium skins (ties into P5 visuals).
6. **Restore/verify**: on launch, read entitlements from `profiles/{uid}` (server truth).

---

## 🔧 Manual Steps

- **🔧 Enable payments** for the bot in **@BotFather** (Stars need no separate provider token — Stars/`XTR` is built in; confirm current BotFather flow).
- **🔧 Set the bot webhook** (or serverless handler) URL for payment updates; add any secret to Vercel env.
- **🔧 Price the products** in Stars with Claude.
- **🔧 Test a real purchase** (Stars) end-to-end on a device; confirm Remove Ads takes effect.

---

## Acceptance criteria

- [ ] Users can buy Remove Ads / a theme / a coin pack with Stars.
- [ ] Payment verified server-side; entitlement granted idempotently by charge id.
- [ ] Remove Ads actually suppresses ads for that user (server-enforced).
- [ ] Premium themes unlock and apply; soft-coin packs credit correctly.

**Est. effort:** ~5–7 days.
