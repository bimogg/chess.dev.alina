import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { BoardTheme, GameMode, SetupConfig, Difficulty, PieceSkin } from '../../types'
import { POLAR_CHECKOUT_URL } from '../../constants/polar'

// ── Inline SVG icons (Lucide-style, 20×20 stroke) ──────────────────
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconCpu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
)
const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const IconLock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

// ── Data ────────────────────────────────────────────────────────────
const BOARD_THEMES: { id: BoardTheme; label: string; light: string; dark: string }[] = [
  { id: 'classic', label: 'Классика', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green',   label: 'Зелёная',  light: '#eeeed2', dark: '#769656' },
  { id: 'walnut',  label: 'Орех',     light: '#f0c68a', dark: '#8b5633' },
  { id: 'ice',     label: 'Лёд',      light: '#dbeafe', dark: '#5d8aa8' },
  { id: 'crimson', label: 'Бордовая', light: '#f5d0d8', dark: '#c2185b' },
]

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 1, label: 'Новичок' },
  { id: 2, label: 'Лёгкий' },
  { id: 3, label: 'Средний' },
  { id: 4, label: 'Сложный' },
  { id: 5, label: 'Эксперт' },
]

const SKIN_COLORS: Record<string, string> = {
  classic: '#d4c5a9',
  gold:    '#c9a84c',
  marble:  '#a0a0a0',
  neon:    '#7b3fe4',
}

const SKINS: { id: PieceSkin; label: string; pro: boolean }[] = [
  { id: 'classic', label: 'Классика', pro: false },
  { id: 'gold',    label: 'Золото',   pro: true  },
  { id: 'marble',  label: 'Мрамор',   pro: true  },
  { id: 'neon',    label: 'Неон',     pro: true  },
]

// ── Component ───────────────────────────────────────────────────────
export function SetupScreen() {
  const {
    goToLanding, startGame, goToMultiplayerLobby,
    pieceSkin: storeSkin, ownedSkins, openSkinsShop,
    profile, openAuthModal,
  } = useGameStore()

  const [mode, setMode]               = useState<GameMode>('local')
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [focusMode, setFocusMode]     = useState(false)
  const [boardTheme, setBoardTheme]   = useState<BoardTheme>('classic')
  const [difficulty, setDifficulty]   = useState<Difficulty>(3)
  const [skin, setSkin]               = useState<PieceSkin>(storeSkin)

  const handleStart = () => {
    if (!profile?.username?.trim()) { openAuthModal(); return }
    if (mode === 'multiplayer') { goToMultiplayerLobby(); return }
    startGame({ mode, playerColor, focusMode, boardTheme, difficulty, pieceSkin: skin } as SetupConfig)
  }

  const handleSkinClick = (s: PieceSkin) => {
    if (ownedSkins.includes(s)) setSkin(s)
    else openSkinsShop()
  }

  return (
    <div className="setup">
      <div className="setup-card">

        {/* Back */}
        <button className="setup-back" onClick={goToLanding}>
          <IconArrowLeft />
          На главную
        </button>

        {/* Header */}
        <div className="setup-header">
          <h2 className="setup-title">НАСТРОЙКА ПАРТИИ</h2>
        </div>

        {/* ── Game Mode ── */}
        <div className="setup-section">
          <div className="setup-label">Режим игры</div>
          <div className="setup-options">
            <button className={`setup-option ${mode === 'local' ? 'selected' : ''}`} onClick={() => setMode('local')}>
              <span className="setup-option-icon"><IconUsers /></span>
              <span className="setup-option-label">Локально</span>
              <span className="setup-option-sub">На одном устройстве</span>
            </button>
            <button className={`setup-option ${mode === 'vs-ai' ? 'selected' : ''}`} onClick={() => setMode('vs-ai')}>
              <span className="setup-option-icon"><IconCpu /></span>
              <span className="setup-option-label">Против ИИ</span>
              <span className="setup-option-sub">Stockfish</span>
            </button>
            <button className={`setup-option ${mode === 'multiplayer' ? 'selected' : ''}`} onClick={() => setMode('multiplayer')}>
              <span className="setup-option-icon"><IconGlobe /></span>
              <span className="setup-option-label">Онлайн</span>
              <span className="setup-option-sub">По ссылке</span>
            </button>
          </div>
        </div>

        {/* ── vs AI options ── */}
        {mode === 'vs-ai' && (
          <>
            <div className="setup-section">
              <div className="setup-label">Ваш цвет</div>
              <div className="setup-options">
                <button className={`setup-option ${playerColor === 'w' ? 'selected' : ''}`} onClick={() => setPlayerColor('w')}>
                  <span className="setup-option-icon"><IconSun /></span>
                  <span className="setup-option-label">Белые</span>
                  <span className="setup-option-sub">Вы ходите первым</span>
                </button>
                <button className={`setup-option ${playerColor === 'b' ? 'selected' : ''}`} onClick={() => setPlayerColor('b')}>
                  <span className="setup-option-icon"><IconMoon /></span>
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

        {/* ── Board Theme ── */}
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
                <span className="theme-swatch-preview">
                  <span className="theme-swatch-half" style={{ background: t.light }} />
                  <span className="theme-swatch-half" style={{ background: t.dark }} />
                </span>
                <span className="theme-swatch-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Piece Skin ── */}
        <div className="setup-section">
          <div className="setup-label">
            Скин фигур
            <button
              className="setup-label-action"
              onClick={() => window.open(POLAR_CHECKOUT_URL, '_blank', 'noopener,noreferrer')}
            >
              ОТКРЫТЬ ВСЁ <IconArrowRight />
            </button>
          </div>
          <div className="theme-swatches">
            {SKINS.map(s => {
              const owned = ownedSkins.includes(s.id)
              return (
                <button
                  key={s.id}
                  className={`theme-swatch ${skin === s.id ? 'selected' : ''} ${!owned ? 'locked' : ''}`}
                  onClick={() => handleSkinClick(s.id)}
                  title={s.label + (s.pro && !owned ? ' (Pro)' : '')}
                >
                  <span className="theme-swatch-preview">
                    <span className="theme-swatch-solid" style={{ background: SKIN_COLORS[s.id] }} />
                    {s.pro && !owned && (
                      <span className="theme-swatch-lock"><IconLock /></span>
                    )}
                  </span>
                  <span className="theme-swatch-label">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Focus Mode ── */}
        <div className="setup-section">
          <div className="setup-toggle-row">
            <div className="setup-toggle-info">
              <div className="setup-toggle-title">
                <IconTarget />
                Режим фокуса
              </div>
              <div className="setup-toggle-desc">Подсвечивает только легальные ходы</div>
            </div>
            <label className="setup-toggle">
              <input type="checkbox" checked={focusMode} onChange={e => setFocusMode(e.target.checked)} />
              <span className="setup-toggle-track">
                <span className="setup-toggle-thumb" />
              </span>
            </label>
          </div>
        </div>

        {/* ── Start ── */}
        <button className="btn-start-match" onClick={handleStart}>
          {mode === 'multiplayer' ? 'Перейти в лобби' : 'Начать партию'}
        </button>

      </div>
    </div>
  )
}
