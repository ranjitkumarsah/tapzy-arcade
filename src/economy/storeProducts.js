// Display-only mirror of server/products.js STARS_PRODUCTS. The server builds the
// real invoice (authoritative price); this drives the store UI.
export const STORE_PRODUCTS = [
  { id: 'remove_ads', icon: '🚫', title: 'Remove Ads', desc: 'No more interstitials', stars: 150, type: 'entitlement', grant: 'noAds' },
  { id: 'coins_500', icon: '🪙', title: '500 Coins', desc: 'Bonus coins', stars: 50, type: 'coins' },
  { id: 'coins_1500', icon: '💰', title: '1500 Coins', desc: 'Best value', stars: 120, type: 'coins' },
  { id: 'theme_neon', icon: '🌈', title: 'Neon Theme', desc: 'A glowing look', stars: 75, type: 'theme', grant: 'neon' },
]
