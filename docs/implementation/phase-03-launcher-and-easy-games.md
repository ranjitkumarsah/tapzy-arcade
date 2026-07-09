# Phase 3 — Launcher, GameShell & Easy Games

**Goal:** The core playable app. A launcher grid, a reusable `GameShell` that every game plugs into (handles score saving + game-over modal), and the three easiest games: **Tic-Tac-Toe, Memory Match, Quiz**. Scores save to Firestore.

**Depends on:** Phase 2 (authenticated Firestore session).

---

## Tasks (Claude writes these as code)

### Infrastructure
1. `src/components/Launcher.jsx` — responsive grid of game cards (icon + title). Tapping a card opens that game. Reads the game registry.
2. Lightweight routing in `App.jsx` (launcher ⇄ game view) — no heavy router needed; a small view-state switch. Use Telegram `BackButton` to return to the launcher.
3. `src/components/GameShell.jsx` — wraps any game:
   - Provides `onGameOver(score)` callback.
   - Calls `saveScore(gameId, score)`.
   - Shows `GameOverModal` (Retry, Back to menu; "Watch ad for bonus" placeholder wired in Phase 6; leaderboard rank wired in Phase 5).
4. `src/firebase/scores.js` — `saveScore(gameId, score)` (writes `scores/{uid}/games/{gameId}`, only updates `highScore` if beaten; increments `playCount`) and `getHighScore(gameId)`.
5. `src/games/registry.js` — array of `{ id, title, icon, component }` using `React.lazy` for each game (lazy-loaded per TRD performance note).

### Games
6. **Tic-Tac-Toe** (`src/games/TicTacToe/`) — vs simple AI (or 2-player pass-and-play); win/draw detection; score = wins or a simple points scheme.
7. **Memory Match** (`src/games/MemoryMatch/`) — grid of cards, flip/match state, score = moves or time-based.
8. **Quiz** (`src/games/Quiz/`) — reads `questions.json` (General Knowledge + Science & Tech), multiple choice, score = correct answers. Claude will generate an initial bank of ~40–60 questions across the two topics.

---

## 🔧 Manual Steps (you do these)

- **🔧 MANUAL STEP — Game icons.** Each launcher card needs an icon. For v1 you can:
  - Let Claude use simple emoji/SVG placeholders (no action needed), **or**
  - Provide your own PNG/SVG icons in `public/icons/` (tell Claude the filenames). Polish happens in Phase 7 regardless.
- **🔧 MANUAL STEP — Review the quiz questions.** Claude generates the question bank; skim `src/games/Quiz/questions.json` for accuracy and tone, and tell Claude any to fix/remove. *(Optional but recommended — factual errors hurt trust.)*
- **🔧 MANUAL STEP — Test on a phone.** Push to `main`, open in Telegram, play each game, confirm scores appear in Firestore (`scores/{uid}/games/{gameId}`).

---

## Files touched

```
src/components/Launcher.jsx      (new)
src/components/GameShell.jsx     (new)
src/components/GameOverModal.jsx (new)
src/firebase/scores.js           (new)
src/games/registry.js            (new)
src/games/TicTacToe/*            (new)
src/games/MemoryMatch/*          (new)
src/games/Quiz/* + questions.json (new)
src/App.jsx                      (modified)
```

---

## Acceptance criteria

- [ ] Launcher shows a grid; tapping a card opens the game; BackButton returns to launcher.
- [ ] All three games are fully playable to a game-over/finish state.
- [ ] `GameOverModal` appears with Retry / Back to menu.
- [ ] High scores persist in Firestore and survive reopening the app.
- [ ] Games are lazy-loaded (check network tab: game JS loads on open, not on launch).
- [ ] No console errors on any device.

**Est. effort:** ~3–5 days (three games + shell infra).
