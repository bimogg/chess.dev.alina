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
        <button className="screen-page-back" onClick={goToLanding}>← На главную</button>
        <div className="screen-page-title">Профиль</div>
        <div className="screen-page-sub">Ваша статистика, ELO и статус аккаунта.</div>

        {!profile ? (
          <div className="profile-card">
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Профиль не создан</div>
              <div style={{ marginBottom: 20 }}>Создайте гостевой профиль, чтобы сохранять ELO и участвовать в лидерборде.</div>
              <button className="mp-host-action" style={{ width: 'auto', padding: '12px 28px', display: 'inline-block' }} onClick={openAuthModal}>
                Создать профиль
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
                    {profile.city ? `📍 ${profile.city}` : 'Город не указан'} · Участник с сегодня
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
                  <div className="profile-stat-label">Партии</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">{profile.wins}</div>
                  <div className="profile-stat-label">Победы</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">
                    {profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0}%
                  </div>
                  <div className="profile-stat-label">Винрейт</div>
                </div>
              </div>
            </div>

            {!isPro && (
              <div className="profile-card">
                <div className="pro-cta-card">
                  <div className="pro-cta-title">★ Перейти на Pro</div>
                  <div className="pro-cta-desc">
                    Откройте 3 премиум-скина фигур (Gold, Marble, Neon), приоритетный анализ Stockfish и бейдж Pro в лидерборде.
                  </div>
                  <button className="pro-cta-btn" onClick={openProUpgrade}>Посмотреть планы →</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="modal-close-btn" onClick={handleSignOut}>Выйти</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
