import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { BoardTheme, GameMode, SetupConfig, Difficulty, PieceSkin } from '../../types'

const BOARD_THEMES: { id: BoardTheme; label: string; light: string; dark: string }[] = [
  { id: 'classic', label: 'Классика', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green',   label: 'Зелёная',  light: '#eeeed2', dark: '#769656' },
  { id: 'walnut',  label: 'Орех',     light: '#f0c68a', dark: '#8b5633' },
  { id: 'ice',     label: 'Лёд',      light: '#e3f2fd', dark: '#5d8aa8' },
  { id: 'crimson', label: 'Бордовая', light: '#fce4ec', dark: '#c2185b' },
]

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 1, label: 'Новичок' },
  { id: 2, label: 'Лёгкий' },
  { id: 3, label: 'Средний' },
  { id: 4, label: 'Сложный' },
  { id: 5, label: 'Эксперт' },
]

const SKINS: { id: PieceSkin; label: string; pro: boolean }[] = [
  { id: 'classic', label: 'Классика', pro: false },
  { id: 'gold',    label: 'Золото',   pro: true },
  { id: 'marble',  label: 'Мрамор',   pro: true },
  { id: 'neon',    label: 'Неон',     pro: true },
]

export function SetupScreen() {
  const {
    goToLanding, startGame, goToMultiplayerLobby,
    pieceSkin: storeSkin, ownedSkins, openProUpgrade, openSkinsShop,
    profile, openAuthModal,
  } = useGameStore()

  const [mode, setMode] = useState<GameMode>('local')
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [focusMode, setFocusMode] = useState(false)
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic')
  const [difficulty, setDifficulty] = useState<Difficulty>(3)
  const [skin, setSkin] = useState<PieceSkin>(storeSkin)

  const handleStart = () => {
    if (!profile?.username?.trim()) {
      openAuthModal()
      return
    }
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
          ← На главную
        </button>

        <div className="setup-header">
          <h2 className="setup-title">Настройка партии</h2>
          <p className="setup-subtitle">Выберите параметры и начните игру</p>
        </div>

        {/* Game Mode */}
        <div className="setup-section">
          <div className="setup-label">Режим игры</div>
          <div className="setup-options">
            <button
              className={`setup-option ${mode === 'local' ? 'selected' : ''}`}
              onClick={() => setMode('local')}
            >
              <span className="setup-option-icon">👥</span>
              <span className="setup-option-label">Локально с другом</span>
              <span className="setup-option-sub">На одном устройстве</span>
            </button>
            <button
              className={`setup-option ${mode === 'vs-ai' ? 'selected' : ''}`}
              onClick={() => setMode('vs-ai')}
            >
              <span className="setup-option-icon">🤖</span>
              <span className="setup-option-label">Против Stockfish</span>
              <span className="setup-option-sub">Шахматный движок</span>
            </button>
            <button
              className={`setup-option ${mode === 'multiplayer' ? 'selected' : ''}`}
              onClick={() => setMode('multiplayer')}
            >
              <span className="setup-option-icon">🌐</span>
              <span className="setup-option-label">Онлайн по ссылке</span>
              <span className="setup-option-sub">Supabase Realtime</span>
            </button>
          </div>
        </div>

        {/* Color — only when vs AI */}
        {mode === 'vs-ai' && (
          <>
            <div className="setup-section">
              <div className="setup-label">Ваш цвет</div>
              <div className="setup-options">
                <button
                  className={`setup-option ${playerColor === 'w' ? 'selected' : ''}`}
                  onClick={() => setPlayerColor('w')}
                >
                  <span className="setup-option-icon">♔</span>
                  <span className="setup-option-label">Белые</span>
                  <span className="setup-option-sub">Вы ходите первым</span>
                </button>
                <button
                  className={`setup-option ${playerColor === 'b' ? 'selected' : ''}`}
                  onClick={() => setPlayerColor('b')}
                >
                  <span className="setup-option-icon">♚</span>
                  <span className="setup-option-label">Чёрные</span>
                  <span className="setup-option-sub">ИИ ходит первым</span>
                </button>
              </div>
            </div>

            <div className="setup-section">
              <div className="setup-label">Сложность</div>
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
          <div className="setup-label">Тема доски</div>
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
            Скин фигур
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
              ★ ОТКРЫТЬ ВСЁ →
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
              <div className="setup-label" style={{ marginBottom: 2 }}>Режим фокуса</div>
              <div className="setup-toggle-desc">Приглушает лишние фигуры и оставляет только легальные ходы</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={focusMode} onChange={e => setFocusMode(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <button className="btn-start-match" onClick={handleStart}>
          {mode === 'multiplayer' ? 'Перейти в лобби →' : 'Начать партию →'}
        </button>
      </div>
    </div>
  )
}
