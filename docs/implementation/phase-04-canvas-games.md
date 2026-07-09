# Phase 4 — Canvas & Grid Games

**Goal:** Add the three harder games — **2048, Snake, Flappy-clone** — each plugged into the existing `GameShell` so score saving and game-over flow come for free.

**Depends on:** Phase 3 (`GameShell`, `scores.js`, registry).

---

## Tasks (Claude writes these as code)

1. **2048** (`src/games/Game2048/`)
   - 4×4 grid logic (merge, spawn, move); win/continue at 2048; lose on no moves.
   - **Swipe gestures** for touch + arrow keys for desktop.
   - Score = running tile-merge score → `onGameOver(score)`.
2. **Snake** (`src/games/Snake/`)
   - Canvas + `requestAnimationFrame` game loop (not `setInterval`).
   - Swipe/keyboard controls; grows on food; dies on wall/self collision.
   - Score = food eaten / length.
3. **Flappy-clone** (`src/games/FlappyClone/`)
   - Canvas + `requestAnimationFrame`; gravity + tap-to-flap physics; pipe collision.
   - Score = pipes passed.
4. Register all three in `src/games/registry.js` (lazy-loaded).
5. Ensure all three pause/clean up their animation frames on unmount and when the Telegram viewport loses focus (avoid runaway loops).

---

## 🔧 Manual Steps (you do these)

- **🔧 MANUAL STEP — Test on a low-end Android phone if possible.** Telegram's user base skews to lower-end Android; confirm Snake and Flappy stay smooth (no visible stutter). Report any lag to Claude for tuning.
- **🔧 MANUAL STEP — Confirm gestures.** On a real phone, verify swipe works for 2048/Snake and tap works for Flappy inside the Telegram WebView (WebViews sometimes intercept gestures).
- **🔧 MANUAL STEP — Icons.** Same as Phase 3 — provide icons or accept placeholders.

---

## Files touched

```
src/games/Game2048/*    (new)
src/games/Snake/*       (new)
src/games/FlappyClone/* (new)
src/games/registry.js   (modified)
```

---

## Acceptance criteria

- [ ] All six games now appear in the launcher and are playable.
- [ ] 2048 responds to both swipe and keyboard.
- [ ] Snake and Flappy run via `requestAnimationFrame` and clean up on exit (no leftover CPU when back at launcher).
- [ ] Scores from all three save to Firestore.
- [ ] Smooth on a mid/low-end phone.

**Est. effort:** ~4–6 days (canvas games take longer to feel right).
