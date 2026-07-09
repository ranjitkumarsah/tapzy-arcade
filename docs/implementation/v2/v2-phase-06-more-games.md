# V2 Phase 6 — More Games (4–6)

**Goal:** Expand the catalog with 4–6 new games, each plugged into the existing `GameShell` (score saving, leaderboard, coins/perks come for free).

**Depends on:** v1 (`GameShell`, registry, leaderboard). Benefits from P1 (perks) and P5 (polish) but not blocked by them.

---

## Candidate games (pick 4–6 with Claude)

| Game | Type | Complexity | Notes |
|---|---|---|---|
| Breakout / Brick Breaker | Arcade (canvas) | Medium | Paddle + ball + bricks; touch drag |
| Reaction Test | Casual | Low | Tap when it turns green; ms score |
| 2048 variants (3×3 / 5×5) | Puzzle | Low | Reuse 2048 logic with size param |
| Sliding Puzzle (15-puzzle) | Puzzle | Low-Med | Image/number tiles |
| Whack-a-Mole | Arcade | Low | Tap targets under time |
| Color Match / Stroop | Brain | Low | Tap matching color/word |
| Simon (memory sequence) | Brain | Low-Med | Repeat the growing sequence |
| Tetris-lite | Arcade (canvas) | High | Optional stretch |
| Word Scramble | Word | Low-Med | Needs a word list |

**Recommended set:** Reaction Test, Whack-a-Mole, Sliding Puzzle, Simon, Breakout (+ Color Match) — a mix of instant-fun and depth, mostly low/medium effort.

---

## Tasks (Claude writes as code)

1. Implement each chosen game as a self-contained component with `onGameOver(score)`, touch-first controls, `requestAnimationFrame` for canvas ones, and cleanup on unmount (per v1 patterns).
2. Register in `src/games/registry.js` (lazy-loaded) with icon + category.
3. Wire per-game background music/SFX (extend the sound engine's TRACKS).
4. Add unit tests for any non-trivial pure logic (Vitest), like v1.

---

## 🔧 Manual Steps

- **🔧 Pick the final game list** with Claude.
- **🔧 Provide word list** if Word Scramble is chosen (or Claude bundles one).
- **🔧 Test each** on a phone (controls, difficulty, performance).

---

## Acceptance criteria

- [ ] 4–6 new games appear in the launcher and are fully playable to game-over.
- [ ] Scores/leaderboard/coins/perks work via `GameShell` with no per-game special-casing.
- [ ] Lazy-loaded; smooth on mid/low-end phones.

**Est. effort:** ~1–2 weeks depending on count/complexity.
