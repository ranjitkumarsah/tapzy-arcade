# Phase 5 — Leaderboard

**Goal:** A public per-game leaderboard (top 50) backed by Firestore, plus each player's own rank surfaced in the game-over modal.

**Depends on:** Phase 2 (auth/rules) and Phase 3 (score saving). Can be built in parallel with Phase 4.

---

## Tasks (Claude writes these as code)

1. `src/firebase/leaderboard.js`:
   - `submitLeaderboardScore(gameId, score, displayName)` — writes/updates `leaderboard/{gameId}/entries/{uid}` **only when the user beats their own high score** (minimizes writes; TRD free-tier note).
   - `getTopScores(gameId, n=50)` — `orderBy('score','desc').limit(n)`.
   - `getMyRank(gameId, uid)` — cheap approach: fetch top 50; if the user is in it, show exact rank; otherwise show "50+" (avoids expensive count queries on the free tier).
2. Hook `submitLeaderboardScore` into `GameShell.onGameOver` (after `saveScore`).
3. `src/components/Leaderboard.jsx` — list view (rank, display name, score), tabbed or selectable per game. Reachable from the launcher (e.g., a "🏆 Leaderboard" entry) and from `GameOverModal`.
4. Show the player's rank + "beat your best!" state in `GameOverModal`.
5. Handle empty leaderboards gracefully (new game, no entries yet).

---

## 🔧 Manual Steps (you do these)

- **🔧 MANUAL STEP — Verify rules allow public read.** In Firebase Console → Firestore → Rules, confirm the deployed rules match `firestore.rules` (leaderboard readable by all). If you changed rules, redeploy: `firebase deploy --only firestore:rules`.
- **🔧 MANUAL STEP — Seed a couple of scores.** Play each game from two different Telegram accounts (or ask a friend) so the leaderboard isn't empty at launch, then eyeball the ordering.

---

## Files touched

```
src/firebase/leaderboard.js      (new)
src/components/Leaderboard.jsx    (new)
src/components/GameOverModal.jsx  (modified — show rank)
src/components/GameShell.jsx      (modified — submit on game over)
src/components/Launcher.jsx       (modified — leaderboard entry)
```

---

## Acceptance criteria

- [ ] Leaderboard shows top 50 per game, correctly ordered.
- [ ] A new high score updates the leaderboard; a lower score does not write.
- [ ] Player's own rank shows in the game-over modal.
- [ ] Empty-state renders cleanly for games with no entries.
- [ ] Reads stay minimal (no full-collection scans).

**Est. effort:** ~2–3 days.
