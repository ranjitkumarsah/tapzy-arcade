import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { GAMES } from '../games/registry'
import { buildProfile } from '../profile/profile'

export default function ProfileModal({ onClose }) {
  const { uid, telegramUser, wallet } = useApp()
  const [data, setData] = useState(null)

  useEffect(() => {
    buildProfile(uid, wallet).then(setData)
    // wallet in deps would refetch on every balance tick; fetch once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const name = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ')
    : 'Player'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-head">
          {telegramUser?.photo_url ? (
            <img className="avatar" src={telegramUser.photo_url} alt="" />
          ) : (
            <div className="avatar avatar--placeholder">{name.charAt(0)}</div>
          )}
          <div className="profile-id">
            <div className="profile-name">{name}</div>
            {data ? <div className="profile-level">Level {data.level}</div> : null}
          </div>
        </div>

        {data ? (
          <>
            <div className="xp-bar">
              <span style={{ width: `${data.pct}%` }} />
            </div>
            <div className="xp-text">
              {data.into} / {data.span} XP to level {data.level + 1}
            </div>

            <div className="profile-stats">
              <Stat label="Games" value={data.stats.gamesPlayed} />
              <Stat label="Coins" value={data.stats.coins} />
              <Stat label="Best streak" value={data.stats.longestStreak} />
              <Stat label="Invites" value={data.stats.referralsQualified} />
            </div>

            <div className="wallet-ledger-title">Badges</div>
            <div className="badges-grid">
              {data.achievements.map((a) => (
                <div
                  key={a.id}
                  className={`badge ${a.unlocked ? 'is-unlocked' : ''}`}
                  title={a.label}
                >
                  <span className="badge-icon">{a.unlocked ? a.icon : '🔒'}</span>
                  <span className="badge-label">{a.label}</span>
                </div>
              ))}
            </div>

            <div className="wallet-ledger-title">Your best scores</div>
            <ul className="wallet-ledger-list">
              {GAMES.map((g) => (
                <li key={g.id}>
                  <span>
                    {g.icon} {g.title}
                  </span>
                  <span className="amt-pos">{data.stats.byGame[g.id]?.highScore || 0}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="loading">Loading…</div>
        )}

        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="wallet-bal">
      <div className="wallet-bal-num">{value}</div>
      <div className="wallet-bal-label">{label}</div>
    </div>
  )
}
