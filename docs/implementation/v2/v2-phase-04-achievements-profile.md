# V2 Phase 4 — Achievements & Profile

**Goal:** Add progression and status: a profile screen with XP/levels, unlockable badges, and lifetime stats. Gives players goals beyond a single high score.

**Depends on:** P1 (economy for badge/level coin rewards, optional).

---

## Tasks (Claude writes as code)

1. **Profile screen** (`src/components/Profile.jsx`)
   - Avatar + name (from Telegram), level + XP bar, coin balance, badges grid, per-game best scores, totals (games played, coins earned, streak).
2. **XP & levels**
   - Earn XP from playing (server-validated on game-over, or derived from ledger/score events to avoid client trust). Level thresholds curve upward; leveling up can grant **bonus (soft) coins**.
3. **Achievements/badges** (`src/economy/achievements.js` + server check)
   - Definitions (e.g., "Score 2048", "7-day streak", "Refer 3 friends", "Play all games", "1000 lifetime coins").
   - Server evaluates and unlocks (badges are status; if they grant coins, must be server-side).
4. **Data**: `profiles/{uid}` = `{ xp, level, badges[], entitlements, stats }` (server-write for anything coin-bearing; pure-cosmetic stats can be client-updated if not tied to money).

---

## 🔧 Manual Steps

- **🔧 Pick the achievement list + XP curve** with Claude. Decide which badges grant coins (soft) vs. pure status.

---

## Acceptance criteria

- [ ] Profile shows level, XP, badges, stats, and balance.
- [ ] Achievements unlock when conditions are met (server-validated where they pay coins).
- [ ] Leveling curve feels rewarding, not grindy.

**Est. effort:** ~4–5 days.
