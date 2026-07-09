// Shown by GameShell when a game ends.
export default function GameOverModal({
  title,
  score,
  best,
  isRecord,
  rank,
  canContinue,
  continueCost,
  onContinue,
  canWatchAd,
  onWatchAd,
  busy,
  adMsg,
  onRetry,
  onExit,
  onLeaderboard,
  onShare,
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
          {canContinue ? (
            <button className="btn btn-primary" onClick={onContinue} disabled={busy}>
              🔄 Continue — keep score ({continueCost} 🪙)
            </button>
          ) : null}
          {canWatchAd ? (
            <button className="btn btn-reward" onClick={onWatchAd} disabled={busy}>
              ▶️ Watch ad to earn coins
            </button>
          ) : null}
          {adMsg ? <div className="ad-msg">{adMsg}</div> : null}

          <button className="btn btn-secondary" onClick={onRetry} disabled={busy}>
            🔁 Play again
          </button>
          {onLeaderboard ? (
            <button className="btn btn-secondary" onClick={onLeaderboard}>
              🏆 Leaderboard
            </button>
          ) : null}
          {onShare ? (
            <button className="btn btn-secondary" onClick={onShare}>
              📣 Challenge a friend
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
