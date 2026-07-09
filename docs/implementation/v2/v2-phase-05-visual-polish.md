# V2 Phase 5 — Visual Polish & "More Attractive"

**Goal:** Make the app feel premium and lively — **rich polish within Telegram's theme** (not a rebrand). Animations, celebration effects, better cards and transitions.

**Depends on:** v1 (independent — can run in parallel with economy phases for momentum).

---

## Tasks (Claude writes as code)

1. **Launcher redesign**
   - Featured/hero area, category grouping (Arcade / Puzzle / Brain), animated game cards (subtle hover/press, gradient accents derived from `themeParams`), coin + streak chips.
2. **Transitions**
   - Smooth launcher⇄game⇄leaderboard transitions (slide/fade), shared-element feel on card→game.
3. **Celebrations**
   - Confetti / particle burst on a new best or big win (canvas or lightweight CSS), animated score count-up in the game-over modal, subtle screen shake on Flappy crash, etc.
4. **Micro-interactions**
   - Button press ripples, coin fly-to-wallet animation when earning, number tickers, skeleton loaders for lists.
5. **Consistency pass**
   - Unified spacing/radius/typography scale; polished empty/error states; refined splash; richer sound cues tied to visual events.
6. **Performance guardrails**
   - Keep effects GPU-friendly and lazy; respect low-end Android; honor reduced-motion.

---

## 🔧 Manual Steps

- **🔧 Art direction check:** review the redesigned launcher/cards on your phone; tell Claude tweaks (accent intensity, motion amount).
- **🔧 Optional assets:** provide game card icons/illustrations if you want custom art (else Claude uses emoji/SVG + gradients).

---

## Acceptance criteria

- [ ] Launcher looks noticeably richer; still adapts to Telegram light/dark.
- [ ] Wins/records trigger celebration effects; transitions feel smooth.
- [ ] No jank on a mid/low-end phone; reduced-motion respected.

**Est. effort:** ~5–7 days.
