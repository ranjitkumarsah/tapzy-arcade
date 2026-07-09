// Server-side economy config. Never shipped to the client. Tune conservatively.
export const config = {
  // Share of net ad revenue that funds the user reward pool (50/50).
  poolSplit: 0.5,

  // Fallback coins granted per verified ad watch when the postback carries no
  // revenue value. If the postback includes a payout/value, coins are derived
  // from it instead (see adReward.js).
  coinsPerAd: 10,

  // 1 coin = this many USD (server-set peg used to convert revenue -> coins).
  coinValueUsd: 0.0001,

  // Max ad-reward credits per user per calendar day (anti-farming).
  dailyAdRewardCap: 50,

  // Referrals (bonus coins). Referrer paid only after the invitee qualifies.
  referralInviteeBonus: 20, // instant, to the new user
  referralReferrerReward: 30, // to the referrer, after qualification
  referralQualifyGames: 3, // invitee must play this many games first

  // When true, ad-reward credits are gated by the reward pool balance (real
  // revenue must exist). Keep false during early testing (no revenue yet),
  // switch on (env ECONOMY_POOL_ENFORCED=true) once revenue tracking is wired.
  poolEnforced: process.env.ECONOMY_POOL_ENFORCED === 'true',
}
