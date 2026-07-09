// Single wrapper around the Monetag SDK so ad logic lives in one place and the
// network can be swapped later. Everything no-ops gracefully when the SDK isn't
// configured (no VITE_MONETAG_ZONE_ID) or fails to load — the app never breaks.
//
// Monetag's in-app/rewarded SDK exposes a global function named `show_<zoneId>`
// once its loader script runs. We call it to display an ad; the returned promise
// resolves when the ad is watched/closed.

const ZONE = import.meta.env.VITE_MONETAG_ZONE_ID
export const adsEnabled = Boolean(ZONE)

let loadPromise = null

function loadSdk() {
  if (!ZONE) return Promise.reject(new Error('no-zone'))
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://libtl.com/sdk.js'
    s.dataset.zone = ZONE
    s.dataset.sdk = `show_${ZONE}`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('sdk-failed'))
    document.head.appendChild(s)
  })
  return loadPromise
}

// Preload the SDK asynchronously so it doesn't block first render.
export function initMonetag() {
  if (ZONE) loadSdk().catch(() => {})
}

function showFn() {
  return typeof window !== 'undefined' ? window[`show_${ZONE}`] : undefined
}

// Opt-in rewarded ad. Resolves true ONLY when Monetag confirms the ad was
// watched to completion — the caller must grant the reward only on true.
// If the ad is unavailable, fails, or the user closes it early, returns false
// and NO reward is given.
export async function showRewarded() {
  try {
    if (!ZONE) return false
    await loadSdk()
    const fn = showFn()
    if (typeof fn !== 'function') return false
    await fn() // resolves only when the reward condition is met
    return true
  } catch {
    return false
  }
}

// Frequency-capped interstitial. Returns true if an ad was shown.
export async function showInterstitial() {
  try {
    if (!ZONE) return false
    await loadSdk()
    const fn = showFn()
    if (typeof fn !== 'function') return false
    await fn()
    return true
  } catch {
    return false
  }
}
