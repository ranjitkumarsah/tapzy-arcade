// Server-authoritative perk catalog (coin prices). The client has a display-only
// mirror in src/economy/perks.js, but THIS is the source of truth for cost.
export const PERKS = {
  // Revive and keep your score (arcade games only).
  continue: { cost: 25, label: 'Continue' },
}

// Telegram Stars products (prices in Stars / XTR). Source of truth for invoices.
export const STARS_PRODUCTS = {
  remove_ads: {
    title: 'Remove Ads',
    description: 'Remove interstitial ads forever',
    stars: 150,
    type: 'entitlement',
    grant: 'noAds',
  },
  coins_500: {
    title: '500 Coins',
    description: '500 bonus coins',
    stars: 50,
    type: 'coins',
    amount: 500,
  },
  coins_1500: {
    title: '1500 Coins',
    description: '1500 bonus coins (best value)',
    stars: 120,
    type: 'coins',
    amount: 1500,
  },
  theme_neon: {
    title: 'Neon Theme',
    description: 'Unlock a glowing neon look',
    stars: 75,
    type: 'theme',
    grant: 'neon',
  },
}
