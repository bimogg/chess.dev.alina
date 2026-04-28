import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { BoardTheme, GameMode, SetupConfig, Difficulty, PieceSkin } from '../../types'
import { POLAR_CHECKOUT_URL } from '../../constants/polar'

// ── Translations ────────────────────────────────────────────────────
type Lang = 'en' | 'ru'
type T = Record<Lang, string>

const COPY: Record<string, T> = {
  back:          { en: 'Back',             ru: 'На главную'         },
  title:         { en: 'GAME SETUP',       ru: 'НАСТРОЙКА ПАРТИИ'   },
  modeLabel:     { en: 'Game Mode',        ru: 'Режим игры'         },
  modeLocal:     { en: 'Local',            ru: 'Локально'           },
  modeLocalSub:  { en: 'Same device',      ru: 'На одном устройстве'},
  modeAI:        { en: 'vs AI',            ru: 'Против ИИ'          },
  modeAISub:     { en: 'Stockfish',        ru: 'Stockfish'          },
  modeOnline:    { en: 'Online',           ru: 'Онлайн'             },
  modeOnlineSub: { en: 'Share a link',     ru: 'По ссылке'          },
  colorLabel:    { en: 'Your Color',       ru: 'Ваш цвет'           },
  colorWhite:    { en: 'White',            ru: 'Белые'              },
  colorWhiteSub: { en: 'You go first',     ru: 'Вы ходите первым'   },
  colorBlack:    { en: 'Black',            ru: 'Чёрные'             },
  colorBlackSub: { en: 'AI goes first',    ru: 'ИИ ходит первым'    },
  diffLabel:     { en: 'Difficulty',       ru: 'Сложность'          },
  boardLabel:    { en: 'Board Theme',      ru: 'Тема доски'         },
  skinLabel:     { en: 'Piece Skin',       ru: 'Скин фигур'         },
  skinUnlock:    { en: 'UNLOCK ALL',       ru: 'ОТКРЫТЬ ВСЁ'        },
  focusLabel:    { en: 'Focus Mode',       ru: 'Режим фокуса'       },
  focusDesc:     { en: 'Highlights legal moves only',
                   ru: 'Подсвечивает только легальные ходы'          },
  startGame:     { en: 'Start Game',       ru: 'Начать партию'      },
  goLobby:       { en: 'Go to Lobby',      ru: 'Перейти в лобби'    },
}

const BOARD_THEMES: { id: BoardTheme; label: T; light: string; dark: string }[] = [
  { id: 'classic', label: { en: 'Classic', ru: 'Классика' }, light: '#f0d9b5', dark: '#b58863' },
  { id: 'green',   label: { en: 'Green',   ru: 'Зелёная'  }, light: '#eeeed2', dark: '#769656' },
  { id: 'walnut',  label: { en: 'Walnut',  ru: 'Орех'     }, light: '#f0c68a', dark: '#8b5633' },
  { id: 'ice',     label: { en: 'Ice',     ru: 'Лёд'      }, light: '#dbeafe', dark: '#5d8aa8' },
  { id: 'crimson', label: { en: 'Crimson', ru: 'Бордовая' }, light: '#f5d0d8', dark: '#c2185b' },
]

const DIFFICULTIES: { id: Difficulty; label: T }[] = [
  { id: 1, label: { en: 'Beginner', ru: 'Новичок' } },
  { id: 2, label: { en: 'Easy',     ru: 'Лёгкий'  } },
  { id: 3, label: { en: 'Medium',   ru: 'Средний' } },
  { id: 4, label: { en: 'Hard',     ru: 'Сложный' } },
  { id: 5, label: { en: 'Expert',   ru: 'Эксперт' } },
]

const SKIN_COLORS: Record<string, string> = {
  classic: '#d4c5a9',
  gold:    '#c9a84c',
  marble:  '#a0a0a0',
  neon:    '#7b3fe4',
}

const SKINS: { id: PieceSkin; label: T; pro: boolean }[] = [
  { id: 'classic', label: { en: 'Classic', ru: 'Классика' }, pro: false },
  { id: 'gold',    label: { en: 'Gold',    ru: 'Золото'   }, pro: true  },
  { id: 'marble',  label: { en: 'Marble',  ru: 'Мрамор'   }, pro: true  },
  { id: 'neon',    label: { en: 'Neon',    ru: 'Неон'     }, pro: true  },
]

// ── Inline SVG icons ────────────────────────────────────────────────
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

// ── Helpers ─────────────────────────────────────────────────────────
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem('cv_lang')
  if (saved === 'ru' || saved === 'en') return saved
  const attr = document.documentElement.getAttribute('data-ui-lang')
  if (attr === 'ru' || attr === 'en') return attr
  return 'en'
}

function saveLang(l: Lang) {
  window.localStorage.setItem('cv_lang', l)
  document.documentElement.setAttribute('data-ui-lang', l)
  document.documentElement.setAttribute('lang', l)
}

// ── Component ───────────────────────────────────────────────────────
export function SetupScreen() {
  const {
    goToLanding, startGame, goToMultiplayerLobby,
    pieceSkin: storeSkin, ownedSkins, openSkinsShop,
    profile, openAuthModal,
  } = useGameStore()

  const [lang, setLang]               = useState<Lang>(getLang)
  const [mode, setMode]               = useState<GameMode>('local')
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [focusMode, setFocusMode]     = useState(false)
  const [boardTheme, setBoardTheme]   = useState<BoardTheme>('classic')
  const [difficulty, setDifficulty]   = useState<Difficulty>(3)
  const [skin, setSkin]               = useState<PieceSkin>(storeSkin)

  const t = (key: string) => COPY[key]?.[lang] ?? key

  const toggleLang = () => {
    const next: Lang = lang === 'en' ? 'ru' : 'en'
    setLang(next)
    saveLang(next)
  }

  // Sync if landing page changes lang while this screen is mounted
  useEffect(() => {
    const handler = () => setLang(getLang())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

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

        {/* Top bar: back + lang toggle */}
        <div className="setup-topbar">
          <button className="setup-back" onClick={goToLanding}>
            <IconArrowLeft />
            {t('back')}
          </button>
          <button className="setup-lang-toggle" onClick={toggleLang} aria-label="Switch language">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {lang.toUpperCase()}
          </button>
        </div>

        {/* Header */}
        <div className="setup-header">
          <h2 className="setup-title">{t('title')}</h2>
        </div>

        {/* ── Game Mode ── */}
        <div className="setup-section">
          <div className="setup-label">{t('modeLabel')}</div>
          <div className="setup-options">
            <button className={`setup-option ${mode === 'local' ? 'selected' : ''}`} onClick={() => setMode('local')}>
              <span className="setup-option-icon"><IconUsers /></span>
              <span className="setup-option-label">{t('modeLocal')}</span>
              <span className="setup-option-sub">{t('modeLocalSub')}</span>
            </button>
            <button className={`setup-option ${mode === 'vs-ai' ? 'selected' : ''}`} onClick={() => setMode('vs-ai')}>
              <span className="setup-option-icon"><IconCpu /></span>
              <span className="setup-option-label">{t('modeAI')}</span>
              <span className="setup-option-sub">{t('modeAISub')}</span>
            </button>
            <button className={`setup-option ${mode === 'multiplayer' ? 'selected' : ''}`} onClick={() => setMode('multiplayer')}>
              <span className="setup-option-icon"><IconGlobe /></span>
              <span className="setup-option-label">{t('modeOnline')}</span>
              <span className="setup-option-sub">{t('modeOnlineSub')}</span>
            </button>
          </div>
        </div>

        {/* ── vs AI options ── */}
        {mode === 'vs-ai' && (
          <>
            <div className="setup-section">
              <div className="setup-label">{t('colorLabel')}</div>
              <div className="setup-options">
                <button className={`setup-option ${playerColor === 'w' ? 'selected' : ''}`} onClick={() => setPlayerColor('w')}>
                  <span className="setup-option-icon"><IconSun /></span>
                  <span className="setup-option-label">{t('colorWhite')}</span>
                  <span className="setup-option-sub">{t('colorWhiteSub')}</span>
                </button>
                <button className={`setup-option ${playerColor === 'b' ? 'selected' : ''}`} onClick={() => setPlayerColor('b')}>
                  <span className="setup-option-icon"><IconMoon /></span>
                  <span className="setup-option-label">{t('colorBlack')}</span>
                  <span className="setup-option-sub">{t('colorBlackSub')}</span>
                </button>
              </div>
            </div>

            <div className="setup-section">
              <div className="setup-label">{t('diffLabel')}</div>
              <div className="difficulty-pills">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.id}
                    className={`difficulty-pill ${difficulty === d.id ? 'selected' : ''}`}
                    onClick={() => setDifficulty(d.id)}
                  >
                    {d.label[lang]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Board Theme ── */}
        <div className="setup-section">
          <div className="setup-label">{t('boardLabel')}</div>
          <div className="theme-swatches">
            {BOARD_THEMES.map(th => (
              <button
                key={th.id}
                className={`theme-swatch ${boardTheme === th.id ? 'selected' : ''}`}
                onClick={() => setBoardTheme(th.id)}
                title={th.label[lang]}
              >
                <span className="theme-swatch-preview">
                  <span className="theme-swatch-half" style={{ background: th.light }} />
                  <span className="theme-swatch-half" style={{ background: th.dark }} />
                </span>
                <span className="theme-swatch-label">{th.label[lang]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Piece Skin ── */}
        <div className="setup-section">
          <div className="setup-label">
            {t('skinLabel')}
            <button
              className="setup-label-action"
              onClick={() => window.open(POLAR_CHECKOUT_URL, '_blank', 'noopener,noreferrer')}
            >
              {t('skinUnlock')} <IconArrowRight />
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
                  title={s.label[lang] + (s.pro && !owned ? ' (Pro)' : '')}
                >
                  <span className="theme-swatch-preview">
                    <span className="theme-swatch-solid" style={{ background: SKIN_COLORS[s.id] }} />
                    {s.pro && !owned && (
                      <span className="theme-swatch-lock"><IconLock /></span>
                    )}
                  </span>
                  <span className="theme-swatch-label">{s.label[lang]}</span>
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
                {t('focusLabel')}
              </div>
              <div className="setup-toggle-desc">{t('focusDesc')}</div>
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
          {mode === 'multiplayer' ? t('goLobby') : t('startGame')}
        </button>

      </div>
    </div>
  )
}
