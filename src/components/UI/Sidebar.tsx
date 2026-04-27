import { useGameStore } from '../../store/gameStore'
import { MoveHistory } from './MoveHistory'
import { CapturedPieces } from './CapturedPieces'

const STATUS_MESSAGES: Record<string, string> = {
  playing: 'In progress',
  check: 'Check!',
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate',
  draw: 'Draw',
}

export function Sidebar() {
  const {
    chess, gameMode, playerColor, focusMode, gameStatus, aiThinking,
    savedGames, goToLanding, goToSetup, resetGame, toggleFocusMode,
    saveCurrentGame, loadGame, deleteGame, undoMove,
    requestHint, clearHint, hintSquare, hintToSquare,
    appTheme, toggleAppTheme,
    isPro, openProUpgrade, openSkinsShop,
    profile, openAuthModal, goToProfile, goToLeaderboard,
    runCoachAnalysis, coachAnalyzing,
    leaveMultiplayer, mpStatus, mpRole, mpRoomId, mpRoomLink,
  } = useGameStore()

  const turn = chess.turn()
  const history = chess.history()
  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw'

  return (
    <aside className="sidebar">
      {/* Top nav */}
      <div className="sidebar-topbar">
        <button className="sidebar-home-btn" onClick={() => { leaveMultiplayer(); goToLanding() }}>
          ← Home
        </button>
        <div className="sidebar-logo">♟ ChessVerse 3D</div>
        <button className="sidebar-new-btn" onClick={goToSetup}>
          New
        </button>
      </div>

      {/* Profile mini */}
      <div className="sidebar-section">
        {profile ? (
          <div className="profile-mini" onClick={goToProfile} style={{ cursor: 'pointer' }}>
            <div className="profile-mini-avatar">{profile.username[0]?.toUpperCase() ?? 'P'}</div>
            <div className="profile-mini-info">
              <div className="profile-mini-name">
                {profile.username}
                {isPro && <span className="badge-pro">PRO</span>}
              </div>
              <div className="profile-mini-meta">
                ⚡ {profile.elo} ELO · {profile.gamesPlayed} games {profile.city ? `· ${profile.city}` : ''}
              </div>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm btn-full" onClick={openAuthModal}>
            👤 Sign in to track ELO
          </button>
        )}
      </div>

      {/* Status */}
      <div className="sidebar-section">
        <div className="status-bar">
          <div className={`status-dot ${gameStatus}`} />
          <span className="status-text">{STATUS_MESSAGES[gameStatus]}</span>
          {aiThinking && <span className="ai-thinking-badge">Stockfish thinking…</span>}
          {gameMode === 'multiplayer' && mpStatus === 'connected' && <span className="badge-live">LIVE</span>}
        </div>
        <div className="turn-indicator">
          <div className={`turn-color ${turn === 'w' ? 'white' : 'black'}`} />
          <span>{turn === 'w' ? 'White' : 'Black'} to move</span>
          <span className="move-counter">
            Move {Math.ceil((history.length + 1) / 2)}
          </span>
        </div>
        {gameMode === 'vs-ai' && (
          <div className="mode-tag">
            <span>vs Stockfish</span>
            <span className="mode-tag-color">{playerColor === 'w' ? 'You: White' : 'You: Black'}</span>
          </div>
        )}
        {gameMode === 'local' && (
          <div className="mode-tag"><span>Local 2-player</span></div>
        )}
        {gameMode === 'multiplayer' && (
          <div className="mode-tag">
            <span>Online Supabase Realtime</span>
            <span className="mode-tag-color">
              {mpRole === 'black'
                ? 'Вы играете за чёрных'
                : mpRole === 'white'
                  ? 'Вы играете за белых'
                  : 'Режим наблюдателя'}
            </span>
          </div>
        )}
        {gameMode === 'multiplayer' && (
          <div className="mode-tag" style={{ marginTop: 6 }}>
            <span>Room: {mpRoomId ?? '—'}</span>
            <span className="mode-tag-color">
              {mpStatus === 'connected' ? 'connected' : mpStatus === 'syncing' ? 'syncing' : mpStatus}
            </span>
          </div>
        )}
        {gameMode === 'multiplayer' && mpRoomLink && (
          <button
            className="btn btn-secondary btn-sm btn-full"
            style={{ marginTop: 8 }}
            onClick={() => navigator.clipboard?.writeText(mpRoomLink)}
          >
            Copy room link
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="sidebar-section">
        <div className="controls-row">
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={undoMove}
            disabled={history.length === 0 || gameMode === 'multiplayer'}
          >
            ↩ Undo
          </button>
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={resetGame}>
            ↺ Restart
          </button>
        </div>
        <div className="controls-row">
          <button
            className="btn btn-primary btn-sm btn-full"
            onClick={saveCurrentGame}
            disabled={history.length === 0}
          >
            💾 Save Game
          </button>
        </div>
        <div className="toggle-row">
          <span className="toggle-label">Focus Mode</span>
          <label className="toggle">
            <input type="checkbox" checked={focusMode} onChange={toggleFocusMode} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="theme-row" style={{ marginTop: 8 }}>
          <span className="toggle-label">Light/Dark</span>
          <button className="theme-toggle-btn" onClick={toggleAppTheme}>
            {appTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>

      {/* AI Coach + Hint */}
      <div className="sidebar-section">
        <div className="section-title">AI Assistant</div>
        <button
          className="btn btn-secondary btn-sm btn-full"
          onClick={hintSquare ? clearHint : requestHint}
          disabled={isGameOver}
          style={{ marginBottom: 8 }}
        >
          {hintSquare ? '✕ Clear hint' : '💡 Get Hint'}
        </button>
        {hintSquare && hintToSquare && (
          <div className="hint-result">
            <span className="hint-from">{hintSquare.toUpperCase()}</span>
            <span className="hint-arrow">→</span>
            <span className="hint-to">{hintToSquare.toUpperCase()}</span>
            <span className="hint-label">Highlighted</span>
          </div>
        )}
        <button
          className="btn btn-primary btn-sm btn-full"
          onClick={runCoachAnalysis}
          disabled={history.length === 0 || coachAnalyzing}
        >
          {coachAnalyzing ? '🧠 Analyzing…' : '🧠 Analyze with AI Coach'}
        </button>
      </div>

      {/* Pro / Skins */}
      <div className="sidebar-section">
        {isPro ? (
          <div className="pro-active-card">
            <div className="pro-active-title">★ ChessVerse Pro</div>
            <div className="pro-active-sub">All skins unlocked</div>
            <button className="btn btn-secondary btn-sm btn-full" onClick={openSkinsShop} style={{ marginTop: 8 }}>
              Switch skin
            </button>
          </div>
        ) : (
          <div className="pro-cta-card">
            <div className="pro-cta-title">★ ChessVerse Pro</div>
            <div className="pro-cta-desc">Premium piece skins, priority engine, cloud sync.</div>
            <button className="pro-cta-btn" onClick={openProUpgrade}>Upgrade to Pro</button>
          </div>
        )}
      </div>

      {/* Leaderboard link */}
      <div className="sidebar-section">
        <button className="btn btn-secondary btn-sm btn-full" onClick={goToLeaderboard}>
          🏆 View Leaderboard
        </button>
      </div>

      {/* Move History */}
      <div className="sidebar-section">
        <div className="section-title">Move History</div>
        <MoveHistory />
      </div>

      {/* Captured Pieces */}
      <div className="sidebar-section">
        <div className="section-title">Captured Pieces</div>
        <CapturedPieces />
      </div>

      {/* Saved Games */}
      {savedGames.length > 0 && (
        <div className="sidebar-section">
          <div className="section-title">Saved Games</div>
          <div className="saved-games-list">
            {savedGames.map(game => (
              <div key={game.id} className="saved-game-item">
                <div>
                  <div className="saved-game-info">
                    {game.moves} moves · {game.status} · {game.mode === 'vs-ai' ? 'vs AI' : game.mode === 'multiplayer' ? 'P2P' : '2P'}
                  </div>
                  <div className="saved-game-date">{game.date}</div>
                </div>
                <div className="saved-game-actions">
                  <button className="btn-icon" onClick={() => loadGame(game.id)}>Load</button>
                  <button className="btn-icon delete" onClick={() => deleteGame(game.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        Built by <strong>Alina</strong> · nFactorial 2nd Round
      </div>
    </aside>
  )
}
