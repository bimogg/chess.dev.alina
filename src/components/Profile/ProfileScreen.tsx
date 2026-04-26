import { useGameStore } from '../../store/gameStore'

export function ProfileScreen() {
  const { profile, goToLanding, signOut, openAuthModal, openProUpgrade, isPro } = useGameStore()

  const handleSignOut = async () => {
    await signOut()
    goToLanding()
  }

  return (
    <div className="screen-page">
      <div className="screen-page-inner">
        <button className="screen-page-back" onClick={goToLanding}>← Home</button>
        <div className="screen-page-title">Profile</div>
        <div className="screen-page-sub">Your stats, ELO, and account.</div>

        {!profile ? (
          <div className="profile-card">
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>You're not signed in</div>
              <div style={{ marginBottom: 20 }}>Create an account to track ELO, climb the leaderboard, and sync across devices.</div>
              <button className="mp-host-action" style={{ width: 'auto', padding: '12px 28px', display: 'inline-block' }} onClick={openAuthModal}>
                Sign in or play as guest
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar-lg">{profile.username[0]?.toUpperCase() ?? 'P'}</div>
                <div>
                  <div className="profile-name">
                    {profile.username}
                    {isPro && <span className="badge-pro">PRO</span>}
                  </div>
                  <div className="profile-meta">
                    {profile.city ? `📍 ${profile.city}` : 'No city set'} · Member since today
                  </div>
                </div>
              </div>

              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-val">{profile.elo}</div>
                  <div className="profile-stat-label">ELO</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">{profile.gamesPlayed}</div>
                  <div className="profile-stat-label">Games</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">{profile.wins}</div>
                  <div className="profile-stat-label">Wins</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">
                    {profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0}%
                  </div>
                  <div className="profile-stat-label">Win Rate</div>
                </div>
              </div>
            </div>

            {!isPro && (
              <div className="profile-card">
                <div className="pro-cta-card">
                  <div className="pro-cta-title">★ Upgrade to Pro</div>
                  <div className="pro-cta-desc">
                    Unlock 3 premium piece skins (Gold, Marble, Neon), priority Stockfish depth, cloud sync, and a Pro badge on the leaderboard.
                  </div>
                  <button className="pro-cta-btn" onClick={openProUpgrade}>See plans →</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="modal-close-btn" onClick={handleSignOut}>Sign out</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
