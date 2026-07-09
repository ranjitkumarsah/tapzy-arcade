// Shown by GameShell when a game ends. In Phase 6 the "Watch ad for bonus"
// button and leaderboard rank get wired in; for now: score, best, retry, menu.
export default function GameOverModal({ title, score, best, isRecord, onRetry, onExit }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{title}</h2>

        <div className="modal-score">
          <div className="score-value">{score}</div>
          <div className="score-label">your score</div>
        </div>

        {isRecord ? (
          <div className="record-badge">🎉 New personal best!</div>
        ) : (
          <div className="best-line">Best: {best}</div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Play again
          </button>
          <button className="btn btn-secondary" onClick={onExit}>
            🏠 Back to menu
          </button>
        </div>
      </div>
    </div>
  )
}
