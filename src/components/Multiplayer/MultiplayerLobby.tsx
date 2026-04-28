import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getRoomFromUrl } from '../../utils/multiplayer'

// ── Language ─────────────────────────────────────────────────────────
type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

// ── Icons ─────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
)
const LinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

// ── Copy ──────────────────────────────────────────────────────────────
type T = Record<Lang, string>
const COPY: Record<string, T> = {
  back:          { en: 'Back',                    ru: 'На главную'                    },
  title:         { en: 'ONLINE MATCH',            ru: 'ОНЛАЙН-МАТЧ'                  },
  subtitle:      { en: 'Play over a shared link via Supabase Realtime',
                   ru: 'Игра по ссылке через Supabase Realtime'                       },
  tabCreate:     { en: 'Create',                  ru: 'Создать'                       },
  tabJoin:       { en: 'Join',                    ru: 'Войти'                         },
  createDesc:    { en: 'Create a room and share the link with your opponent. You play as White.',
                   ru: 'Создайте комнату и отправьте ссылку другу. Вы играете белыми.' },
  createBtn:     { en: 'Create Room',             ru: 'Создать комнату'               },
  creating:      { en: 'Creating room…',          ru: 'Создаю комнату…'               },
  roomCreated:   { en: 'Room created',            ru: 'Комната создана'               },
  roomId:        { en: 'Room ID',                 ru: 'ID комнаты'                    },
  copyLink:      { en: 'Copy link',               ru: 'Скопировать'                   },
  copied:        { en: 'Copied',                  ru: 'Скопировано'                   },
  waitingDesc:   { en: 'Share the link. Your opponent will join as Black.',
                   ru: 'Отправьте ссылку другу. Он присоединится чёрными.'            },
  startBtn:      { en: 'Start as White',          ru: 'Начать белыми'                 },
  joinDesc:      { en: 'Paste the invite link or room code from your opponent. You play as Black.',
                   ru: 'Вставьте ссылку-приглашение или код комнаты. Вы играете чёрными.' },
  inputLabel:    { en: 'Link or room code',       ru: 'Ссылка или код комнаты'        },
  inputPlaceholder: { en: 'cv-xxxxxxxx or full URL', ru: 'cv-xxxxxxxx или ссылка'    },
  joinBtn:       { en: 'Join Match',              ru: 'Войти в матч'                  },
  joining:       { en: 'Connecting…',             ru: 'Подключение…'                  },
  footer:        { en: 'Moves are synced in real time between devices',
                   ru: 'Ходы синхронизируются между устройствами в реальном времени'   },
}

// ── Component ─────────────────────────────────────────────────────────
export function MultiplayerLobby() {
  const {
    goToLanding, startHostedMultiplayer,
    hostMultiplayer, joinMultiplayer, leaveMultiplayer,
    mpStatus, mpRoomId, mpRoomLink, mpRole, mpAwaitingHostStart, mpError,
    profile, openAuthModal,
  } = useGameStore()

  const [tab, setTab]           = useState<'host' | 'join'>('host')
  const [roomInput, setRoomInput] = useState('')
  const [copied, setCopied]     = useState(false)
  const [lang]                  = useState<Lang>(getLang)

  const t = (key: string) => COPY[key]?.[lang] ?? key

  useEffect(() => {
    const room = getRoomFromUrl()
    if (room) { setTab('join'); setRoomInput(room) }
  }, [])

  const handleCopy = () => {
    if (!mpRoomLink) return
    navigator.clipboard?.writeText(mpRoomLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleHost = () => {
    if (!profile?.username?.trim()) { openAuthModal(); return }
    hostMultiplayer()
  }

  const handleJoin = () => {
    if (!profile?.username?.trim()) { openAuthModal(); return }
    const cleaned = roomInput.trim()
    if (!cleaned) return
    let room = cleaned
    try {
      const url = new URL(cleaned)
      const fromPath = url.pathname.match(/\/room\/([^/]+)/)?.[1]
      room = fromPath ?? url.searchParams.get('room') ?? cleaned
    } catch { /* not a URL */ }
    joinMultiplayer(room)
  }

  const isHosting    = mpStatus === 'hosting' && !mpRoomLink
  const roomReady    = !!mpRoomLink && mpAwaitingHostStart && mpRole === 'white'

  return (
    <div className="mp-lobby">
      <div className="mp-lobby-card">

        {/* Top bar */}
        <div className="mp-topbar">
          <button className="mp-back-btn" onClick={() => { leaveMultiplayer(); goToLanding() }}>
            <ArrowLeftIcon />
            {t('back')}
          </button>
        </div>

        {/* Header */}
        <div className="mp-header">
          <div className="mp-header-icon"><GlobeIcon /></div>
          <h2 className="mp-title">{t('title')}</h2>
          <p className="mp-subtitle">{t('subtitle')}</p>
        </div>

        {/* Segmented tabs */}
        <div className="mp-tabs">
          <button
            className={`mp-tab ${tab === 'host' ? 'active' : ''}`}
            onClick={() => setTab('host')}
          >
            {t('tabCreate')}
          </button>
          <button
            className={`mp-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            {t('tabJoin')}
          </button>
        </div>

        {/* ── Create tab ── */}
        {tab === 'host' && (
          <div className="mp-tab-body">
            <p className="mp-desc">{t('createDesc')}</p>

            <button
              className="mp-action-btn"
              onClick={handleHost}
              disabled={isHosting || roomReady}
            >
              {isHosting ? t('creating') : t('createBtn')}
            </button>

            {roomReady && (
              <div className="mp-room-panel">
                <div className="mp-room-panel-row">
                  <span className="mp-room-panel-label">{t('roomCreated')}</span>
                  <span className="mp-room-id">{mpRoomId}</span>
                </div>

                <div className="mp-room-link-row">
                  <input
                    className="mp-room-link-input"
                    value={mpRoomLink}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button className="mp-copy-btn" onClick={handleCopy}>
                    {copied ? <><CheckIcon />{t('copied')}</> : <><LinkIcon />{t('copyLink')}</>}
                  </button>
                </div>

                <p className="mp-room-waiting">{t('waitingDesc')}</p>

                <button className="mp-action-btn" onClick={startHostedMultiplayer}>
                  {t('startBtn')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Join tab ── */}
        {tab === 'join' && (
          <div className="mp-tab-body">
            <p className="mp-desc">{t('joinDesc')}</p>

            <div className="mp-input-group">
              <div className="mp-input-label">{t('inputLabel')}</div>
              <input
                className="mp-input"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
                autoFocus
              />
            </div>

            <button
              className="mp-action-btn"
              onClick={handleJoin}
              disabled={!roomInput.trim() || mpStatus === 'joining'}
            >
              {mpStatus === 'joining' ? t('joining') : t('joinBtn')}
            </button>
          </div>
        )}

        {mpError && <div className="mp-error">{mpError}</div>}

        <p className="mp-footer">{t('footer')}</p>

      </div>
    </div>
  )
}
