import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { GAMES } from '../games/registry'
import { getDailyStatus } from '../economy/daily'
import { getReferralStats } from '../economy/referral'

// XP curve: cumulative XP required to REACH level n is triangular, so each level
// needs progressively more (level 2 = 100, 3 = 300, 4 = 600, ...).
export function xpForLevel(n) {
  return (100 * (n - 1) * n) / 2
}

export function levelProgress(xp) {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level += 1
  const cur = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return {
    level,
    into: xp - cur,
    span: next - cur,
    pct: Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)),
  }
}

export function computeXp(s) {
  return (
    s.gamesPlayed * 10 +
    Math.floor(s.totalBest / 5) +
    s.longestStreak * 20 +
    s.referralsQualified * 50
  )
}

// Status-only badges (no coins granted → safe to evaluate on the client).
export const ACHIEVEMENTS = [
  { id: 'first', icon: '🎮', label: 'First Game', test: (s) => s.gamesPlayed >= 1 },
  { id: 'ten', icon: '🕹️', label: '10 Games', test: (s) => s.gamesPlayed >= 10 },
  { id: 'fifty', icon: '🔥', label: '50 Games', test: (s) => s.gamesPlayed >= 50 },
  { id: 'allrounder', icon: '🌟', label: 'Tried All', test: (s) => s.gamesTried >= GAMES.length },
  { id: 'streak3', icon: '📅', label: '3-Day Streak', test: (s) => s.longestStreak >= 3 },
  { id: 'streak7', icon: '🗓️', label: '7-Day Streak', test: (s) => s.longestStreak >= 7 },
  { id: 'coins100', icon: '🪙', label: '100 Coins', test: (s) => s.coins >= 100 },
  { id: 'quiz8', icon: '🧠', label: 'Quiz Whiz', test: (s) => (s.byGame.quiz?.highScore || 0) >= 8 },
  { id: 'refer1', icon: '🤝', label: 'First Invite', test: (s) => s.referralsQualified >= 1 },
  { id: 'refer5', icon: '👑', label: '5 Invites', test: (s) => s.referralsQualified >= 5 },
]

async function getGameStats(uid) {
  const map = {}
  if (db && uid) {
    try {
      const snap = await getDocs(collection(db, 'scores', uid, 'games'))
      snap.forEach((d) => {
        map[d.id] = { highScore: d.data().highScore || 0, playCount: d.data().playCount || 0 }
      })
    } catch {
      /* rules/offline — return what we have */
    }
  }
  return map
}

export async function buildProfile(uid, wallet) {
  const [byGame, daily, refStats] = await Promise.all([
    getGameStats(uid),
    getDailyStatus(uid),
    getReferralStats(uid),
  ])

  const games = Object.values(byGame)
  const stats = {
    gamesPlayed: games.reduce((a, g) => a + (g.playCount || 0), 0),
    totalBest: games.reduce((a, g) => a + (g.highScore || 0), 0),
    gamesTried: Object.keys(byGame).length,
    longestStreak: daily.longest || daily.streak || 0,
    coins: (wallet?.earnedCoins || 0) + (wallet?.bonusCoins || 0),
    referralsQualified: refStats.qualified || 0,
    byGame,
  }

  const xp = computeXp(stats)
  const progress = levelProgress(xp)
  const achievements = ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.test(stats) }))
  return { stats, xp, ...progress, achievements }
}
