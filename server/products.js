// Server-authoritative perk catalog (coin prices). The client has a display-only
// mirror in src/economy/perks.js, but THIS is the source of truth for cost.
export const PERKS = {
  // Revive and keep your score (arcade games only).
  continue: { cost: 25, label: 'Continue' },
}
