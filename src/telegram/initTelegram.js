// Bot/app identity — configured centrally in src/appConfig.js.
import { BOT_USERNAME, APP_SHORT_NAME, SHARE_TEXT } from '../appConfig'
export { BOT_USERNAME, APP_SHORT_NAME }

// Central Telegram WebApp integration.
//
// Responsibilities:
//  - ready() / expand() handshake
//  - expose raw initData (for Phase 2 server verification) and the parsed user
//  - map Telegram themeParams -> CSS variables and keep them in sync
//  - track the stable viewport height as a CSS variable
//  - degrade gracefully to a mock when run outside Telegram (local dev)

const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

export const isInsideTelegram = Boolean(webApp && webApp.initData !== undefined && webApp.platform !== 'unknown')

// A predictable fake identity so `npm run dev` in a normal browser works.
const MOCK_USER = {
  id: 999000001,
  first_name: 'Dev',
  last_name: 'Tester',
  username: 'devtester',
  language_code: 'en',
  photo_url: '',
}

// Map Telegram theme params to our CSS custom properties.
// Telegram may omit some keys depending on client/version, so we only set what exists.
const THEME_MAP = {
  bg_color: '--bg',
  secondary_bg_color: '--card',
  text_color: '--text',
  hint_color: '--hint',
  link_color: '--link',
  button_color: '--accent',
  button_text_color: '--accent-text',
  header_bg_color: '--header-bg',
  section_bg_color: '--section-bg',
  destructive_text_color: '--danger',
}

function applyTheme() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const params = webApp?.themeParams || {}

  for (const [tgKey, cssVar] of Object.entries(THEME_MAP)) {
    const value = params[tgKey]
    if (value) root.style.setProperty(cssVar, value)
  }

  // light | dark — lets CSS make finer decisions if needed.
  const scheme = webApp?.colorScheme || 'dark'
  root.setAttribute('data-theme', scheme)
}

function applyViewport() {
  if (typeof document === 'undefined' || !webApp) return
  const stable = webApp.viewportStableHeight
  if (stable) {
    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${stable}px`)
  }
}

let initialized = false

// Idempotent: safe to call more than once (StrictMode double-invoke, remounts).
export function initTelegram() {
  if (!isInsideTelegram) {
    // Outside Telegram: still apply our default theme vars (already in CSS) and bail.
    return { insideTelegram: false }
  }

  if (!initialized) {
    initialized = true
    webApp.ready()
    webApp.expand()
    applyTheme()
    applyViewport()

    // Keep in sync if the user switches theme or the viewport resizes.
    webApp.onEvent('themeChanged', applyTheme)
    webApp.onEvent('viewportChanged', applyViewport)
  }

  return { insideTelegram: true }
}

// Raw initData string — send this to the server in Phase 2. Empty outside Telegram.
export function getInitData() {
  return isInsideTelegram ? webApp.initData || '' : ''
}

// The `startapp` parameter (e.g. "ref_<uid>") used for referral deep links.
export function getStartParam() {
  return isInsideTelegram ? webApp.initDataUnsafe?.start_param || '' : ''
}

// Parsed user for immediate UI use only. NEVER trust this for auth — that's what
// server-side initData verification (Phase 2) is for.
export function getTelegramUser() {
  if (!isInsideTelegram) return MOCK_USER
  return webApp.initDataUnsafe?.user || MOCK_USER
}

export function getWebApp() {
  return webApp || null
}

// --- BackButton helpers (used by the launcher/games in later phases) ---------
export function showBackButton(handler) {
  if (!webApp?.BackButton) return () => {}
  webApp.BackButton.show()
  webApp.BackButton.onClick(handler)
  // Return a cleanup fn the caller can run on unmount.
  return () => {
    webApp.BackButton.offClick(handler)
    webApp.BackButton.hide()
  }
}

export function hapticImpact(style = 'light') {
  webApp?.HapticFeedback?.impactOccurred?.(style)
}

export function hapticNotify(type = 'success') {
  webApp?.HapticFeedback?.notificationOccurred?.(type)
}

// Deep link to the Mini App. `ref` seeds referral tracking for later (v2).
export function getShareLink(ref) {
  const base = `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}`
  return ref ? `${base}?startapp=ref_${ref}` : base
}

// Open Telegram's native share sheet with the app link (growth loop).
export function shareApp({ ref, text } = {}) {
  const link = getShareLink(ref)
  const message = text || SHARE_TEXT
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`
  hapticImpact('light')
  if (webApp?.openTelegramLink) webApp.openTelegramLink(shareUrl)
  else window.open(shareUrl, '_blank')
}

// Disable Telegram's vertical swipe-to-close during gameplay (Bot API 7.7+),
// so swipes/taps go to the game instead of accidentally closing the app.
export function setVerticalSwipes(enabled) {
  try {
    if (enabled) webApp?.enableVerticalSwipes?.()
    else webApp?.disableVerticalSwipes?.()
  } catch {
    /* older clients: no-op */
  }
}
