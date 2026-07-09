// Shown by GameShell when a game ends. In Phase 6 the "Watch ad for bonus"
// button and leaderboard rank get wired in; for now: score, best, retry, menu.
export default function GameOverModal({
  title,
  score,
  best,
  isRecord,
  rank,
  canWatchAd,
  onWatchAd,
  adMsg,
  onRetry,
  onExit,
  onLeaderboard,
}) {
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

        {rank ? <div className="best-line">🏆 Rank #{rank}</div> : null}

        <div className="modal-actions">
          {canWatchAd ? (
            <button className="btn btn-reward" onClick={onWatchAd}>
              ▶️ Watch ad for bonus points
            </button>
          ) : null}
          {adMsg ? <div className="ad-msg">{adMsg}</div> : null}
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Play again
          </button>
          {onLeaderboard ? (
            <button className="btn btn-secondary" onClick={onLeaderboard}>
              🏆 Leaderboard
            </button>
          ) : null}
          <button className="btn btn-secondary" onClick={onExit}>
            🏠 Back to menu
          </button>
        </div>
      </div>
    </div>
  )
}
