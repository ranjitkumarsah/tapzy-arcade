// Single wrapper around the Monetag SDK so ad logic lives in one place and the
// network can be swapped later. Everything no-ops gracefully when the SDK isn't
// configured (no VITE_MONETAG_ZONE_ID) or fails to load — the app never breaks.
//
// Monetag's multi-format SDK exposes a global function `show_<zoneId>` once its
// loader runs. The one function drives every format:
//   fn()                              -> rewarded interstitial (resolves on watch)
//   fn({ type: 'inApp', inAppSettings }) -> automatic in-app interstitials
//
// VITE_MONETAG_ZONE_ID       — main zone (rewarded + on-open + in-app fallback)
// VITE_MONETAG_INAPP_ZONE_ID — optional separate zone for auto in-app ads

const ZONE = import.meta.env.VITE_MONETAG_ZONE_ID
const INAPP_ZONE = import.meta.env.VITE_MONETAG_INAPP_ZONE_ID || ZONE

export const adsEnabled = Boolean(ZONE)

const loaders = {}

function loadSdk(zone) {
  if (!zone) return Promise.reject(new Error('no-zone'))
  if (loaders[zone]) return loaders[zone]
  loaders[zone] = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://libtl.com/sdk.js'
    s.dataset.zone = zone
    s.dataset.sdk = `show_${zone}`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('sdk-failed'))
    document.head.appendChild(s)
  })
  return loaders[zone]
}

function showFn(zone) {
  return typeof window !== 'undefined' ? window[`show_${zone}`] : undefined
}

// Preload the SDK. We intentionally do NOT start Monetag's auto in-app
// interstitials: they fire on Monetag's own timer and interrupt active
// gameplay. Ads are shown only at natural breaks instead (game open, occasional
// menu return, and the opt-in rewarded button).
export function initMonetag() {
  if (!ZONE) return
  loadSdk(ZONE).catch(() => {})
}

// Available if ever needed, but not called — auto in-app ads interrupt play.
export function startAutoInApp() {
  if (!INAPP_ZONE) return
  loadSdk(INAPP_ZONE)
    .then(() => {
      const fn = showFn(INAPP_ZONE)
      if (typeof fn !== 'function') return
      fn({
        type: 'inApp',
        inAppSettings: {
          frequency: 2, // up to 2 ads...
          capping: 0.1, // ...per 0.1h (6 min)
          interval: 60, // at least 60s apart
          timeout: 8, // wait 8s after load before the first
          everyPage: false,
        },
      })
    })
    .catch(() => {})
}

// Opt-in rewarded ad. Resolves true ONLY when Monetag confirms the ad was
// watched. Pass the user id so it rides along as the ad "ymid" and comes back
// in the S2S postback to /api/adReward (which credits the coins server-side).
export async function showRewarded(userId) {
  try {
    if (!ZONE) return false
    await loadSdk(ZONE)
    const fn = showFn(ZONE)
    if (typeof fn !== 'function') return false
    // Monetag's YMID is a single value we pass and get back in the postback.
    // We pack "<userId>__<uniqueNonce>" so the server can recover the user AND
    // treat each watch as a unique (idempotent) event.
    const nonce = `${Date.now()}${Math.floor(Math.random() * 1e6)}`
    const ymid = userId ? `${userId}__${nonce}` : nonce
    await fn({ ymid })
    return true
  } catch {
    return false
  }
}

// Frequency-capped interstitial (used on game-open / occasional).
export async function showInterstitial() {
  try {
    if (!ZONE) return false
    await loadSdk(ZONE)
    const fn = showFn(ZONE)
    if (typeof fn !== 'function') return false
    await fn()
    return true
  } catch {
    return false
  }
}
