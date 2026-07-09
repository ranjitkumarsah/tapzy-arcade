// Applies an unlocked premium theme by setting a data attribute the CSS reads.
// The choice is remembered locally; ownership is enforced by the store UI.
const KEY = 'tapzy_theme'

export function currentPremiumTheme() {
  try {
    return localStorage.getItem(KEY) || null
  } catch {
    return null
  }
}

export function applyPremiumTheme() {
  const t = currentPremiumTheme()
  if (t) document.documentElement.dataset.premium = t
  else delete document.documentElement.dataset.premium
}

export function setPremiumTheme(t) {
  try {
    if (t) localStorage.setItem(KEY, t)
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  applyPremiumTheme()
}
