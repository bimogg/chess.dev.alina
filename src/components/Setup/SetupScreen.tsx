import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { BoardTheme, GameMode, SetupConfig, Difficulty, PieceSkin } from '../../types'

const BOARD_THEMES: { id: BoardTheme; label: string; light: string; dark: string }[] = [
  { id: 'classic', label: 'Classic', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green',   label: 'Green',   light: '#eeeed2', dark: '#769656' },
  { id: 'walnut',  label: 'Walnut',  light: '#f0c68a', dark: '#8b5633' },
  { id: 'ice',     label: 'Ice',     light: '#e3f2fd', dark: '#5d8aa8' },
  { id: 'crimson', label: 'Crimson', light: '#fce4ec', dark: '#c2185b' },
]

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 1, label: 'Beginner' },
  { id: 2, label: 'Easy' },
  { id: 3, label: 'Medium' },
  { id: 4, label: 'Hard' },
  { id: 5, label: 'Expert' },
]

const SKINS: { id: PieceSkin; label: string; pro: boolean }[] = [
  { id: 'classic', label: 'Classic', pro: false },
  { id: 'gold',    label: 'Gold',    pro: true },
  { id: 'marble',  label: 'Marble',  pro: true },
  { id: 'neon',    label: 'Neon',    pro: true },
]

export function SetupScreen() {
  const {
    goToLanding, startGame, goToMultiplayerLobby,
    pieceSkin: storeSkin, ownedSkins, openProUpgrade, openSkinsShop,
  } = useGameStore()

  const [mode, setMode] = useState<GameMode>('local')
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [focusMode, setFocusMode] = useState(false)
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic')
  const [difficulty, setDifficulty] = useState<Difficulty>(3)
  const [skin, setSkin] = useState<PieceSkin>(storeSkin)

  const handleStart = () => {
    if (mode === 'multiplayer') {
      goToMultiplayerLobby()
      return
    }
    const config: SetupConfig = { mode, playerColor, focusMode, boardTheme, difficulty, pieceSkin: skin }
    startGame(config)
  }

  const handleSkinClick = (s: PieceSkin) => {
    if (ownedSkins.includes(s)) {
      setSkin(s)
    } else {
      openSkinsShop()
    }
  }

  return (
    <div className="setup">
      <div className="setup-card">
        <button className="setup-back" onClick={goToLanding}>
          ← Back to Home
        </button>

        <div className="setup-header">
          <h2 className="setup-title">Configure Your Match</h2>
          <p className="setup-subtitle">Choose your settings and start playing</p>
        </div>

        {/* Game Mode */}
        <div className="setup-section">
          <div className="setup-label">Game Mode</div>
          <div className="setup-options">
            <button
              className={`setup-option ${mode === 'local' ? 'selected' : ''}`}
              onClick={() => setMode('local')}
            >
              <span className="setup-option-icon">👥</span>
              <span className="setup-option-label">Friend Local</span>
              <span className="setup-option-sub">Same device</span>
            </button>
            <button
              className={`setup-option ${mode === 'vs-ai' ? 'selected' : ''}`}
              onClick={() => setMode('vs-ai')}
            >
              <span className="setup-option-icon">🤖</span>
              <span className="setup-option-label">vs Stockfish</span>
              <span className="setup-option-sub">Real chess engine</span>
            </button>
            <button
              className={`setup-option ${mode === 'multiplayer' ? 'selected' : ''}`}
              onClick={() => setMode('multiplayer')}
            >
              <span className="setup-option-icon">🌐</span>
              <span className="setup-option-label">Online P2P</span>
              <span className="setup-option-sub">Share invite link</span>
            </button>
          </div>
        </div>

        {/* Color — only when vs AI */}
        {mode === 'vs-ai' && (
          <>
            <div className="setup-section">
              <div className="setup-label">Your Color</div>
              <div className="setup-options">
                <button
                  className={`setup-option ${playerColor === 'w' ? 'selected' : ''}`}
                  onClick={() => setPlayerColor('w')}
                >
                  <span className="setup-option-icon">♔</span>
                  <span className="setup-option-label">White</span>
                  <span className="setup-option-sub">You move first</span>
                </button>
                <button
                  className={`setup-option ${playerColor === 'b' ? 'selected' : ''}`}
                  onClick={() => setPlayerColor('b')}
                >
                  <span className="setup-option-icon">♚</span>
                  <span className="setup-option-label">Black</span>
                  <span className="setup-option-sub">AI moves first</span>
                </button>
              </div>
            </div>

            <div className="setup-section">
              <div className="setup-label">Difficulty</div>
              <div className="difficulty-pills">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.id}
                    className={`difficulty-pill ${difficulty === d.id ? 'selected' : ''}`}
                    onClick={() => setDifficulty(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Board Theme */}
        <div className="setup-section">
          <div className="setup-label">Board Theme</div>
          <div className="theme-swatches">
            {BOARD_THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-swatch ${boardTheme === t.id ? 'selected' : ''}`}
                onClick={() => setBoardTheme(t.id)}
                title={t.label}
              >
                <span className="theme-swatch-half" style={{ background: t.light }} />
                <span className="theme-swatch-half" style={{ background: t.dark }} />
                <span className="theme-swatch-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Piece Skin */}
        <div className="setup-section">
          <div className="setup-label">
            Piece Skin
            <button
              onClick={openProUpgrade}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                cursor: 'pointer',
              }}
            >
              ★ UNLOCK ALL →
            </button>
          </div>
          <div className="theme-swatches">
            {SKINS.map(s => {
              const owned = ownedSkins.includes(s.id)
              return (
                <button
                  key={s.id}
                  className={`theme-swatch ${skin === s.id ? 'selected' : ''}`}
                  onClick={() => handleSkinClick(s.id)}
                  title={s.label + (s.pro && !owned ? ' (Pro)' : '')}
                  style={{ position: 'relative', opacity: owned ? 1 : 0.7 }}
                >
                  <span className="theme-swatch-half" style={{
                    background: s.id === 'gold' ? 'linear-gradient(135deg, #fff2c4, #b8860b)'
                      : s.id === 'marble' ? 'linear-gradient(135deg, #f0f0f0, #5b5b5b)'
                      : s.id === 'neon' ? 'linear-gradient(135deg, #ff00aa, #00ffe1)'
                      : '#ecdfc8'
                  }} />
                  <span className="theme-swatch-label">
                    {s.label}{s.pro && !owned ? ' 🔒' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Focus Mode */}
        <div className="setup-section">
          <div className="setup-toggle-row">
            <div>
              <div className="setup-label" style={{ marginBottom: 2 }}>Focus Mode</div>
              <div className="setup-toggle-desc">Dim irrelevant pieces, highlight legal moves only</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={focusMode} onChange={e => setFocusMode(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <button className="btn-start-match" onClick={handleStart}>
          {mode === 'multiplayer' ? 'Continue to Lobby →' : 'Start Match →'}
        </button>
      </div>
    </div>
  )
}
