import { useGameStore } from '../../store/gameStore'
import { PieceSkin } from '../../types'
import { POLAR_CHECKOUT_URL } from '../../constants/polar'

// ── Language ────────────────────────────────────────────────────────
type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

// ── Icons ───────────────────────────────────────────────────────────
const KingIcon = ({ color = 'currentColor', size = 34 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="5"/>
    <line x1="10" y1="3" x2="14" y2="3"/>
    <path d="M6 21h12l2-10-5 3-3-6-3 6-5-3 2 10z"/>
    <line x1="6" y1="21" x2="18" y2="21"/>
  </svg>
)
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Skin data ───────────────────────────────────────────────────────
const SKIN_COLOR: Record<string, string> = {
  classic: '#b8a890',
  gold:    '#9a7c3a',
  marble:  '#7a8898',
  neon:    '#5b3fa6',
}

const SKINS: {
  id: PieceSkin
  label: Record<Lang, string>
  desc:  Record<Lang, string>
  pro: boolean
}[] = [
  {
    id: 'classic',
    label: { en: 'Classic', ru: 'Классика' },
    desc:  { en: 'Timeless ivory & ebony', ru: 'Слоновая кость и эбен' },
    pro: false,
  },
  {
    id: 'gold',
    label: { en: 'Gold', ru: 'Золото' },
    desc:  { en: 'Matte polished metal', ru: 'Матовый полированный металл' },
    pro: true,
  },
  {
    id: 'marble',
    label: { en: 'Marble', ru: 'Мрамор' },
    desc:  { en: 'Cool stone finish', ru: 'Фактура холодного камня' },
    pro: true,
  },
  {
    id: 'neon',
    label: { en: 'Neon', ru: 'Неон' },
    desc:  { en: 'Deep emissive violet', ru: 'Глубокий фиолетовый' },
    pro: true,
  },
]

// ── Copy ────────────────────────────────────────────────────────────
const COPY: Record<string, Record<Lang, string>> = {
  title:        { en: 'PIECE SKINS',    ru: 'СКИНЫ ФИГУР'      },
  subtitlePro:  { en: 'All skins unlocked. Click to switch.',
                  ru: 'Все скины открыты. Нажмите, чтобы переключить.' },
  subtitleFree: { en: 'Pro skins require ChessVerse Pro.',
                  ru: 'Премиум-скины входят в ChessVerse Pro.' },
  unlockPro:    { en: 'UNLOCK PRO',     ru: 'ОТКРЫТЬ PRO'      },
  close:        { en: 'CLOSE',          ru: 'ЗАКРЫТЬ'          },
  active:       { en: 'Active',         ru: 'Активен'          },
  available:    { en: 'Available',      ru: 'Доступен'         },
  pro:          { en: 'Pro',            ru: 'Pro'              },
}

// ── Component ───────────────────────────────────────────────────────
export function SkinsShopModal() {
  const {
    showSkinsShop, closeSkinsShop,
    pieceSkin, ownedSkins, setPieceSkin,
    isPro, openProUpgrade,
  } = useGameStore()

  if (!showSkinsShop) return null

  const lang = getLang()
  const t = (key: string) => COPY[key]?.[lang] ?? key

  const handleClick = (id: PieceSkin) => {
    if (ownedSkins.includes(id)) {
      setPieceSkin(id)
    } else {
      closeSkinsShop()
      openProUpgrade()
    }
  }

  return (
    <div className="modal-overlay" onClick={closeSkinsShop}>
      <div className="skins-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="skins-modal-header">
          <h2 className="skins-modal-title">{t('title')}</h2>
          <p className="skins-modal-subtitle">
            {isPro ? t('subtitlePro') : t('subtitleFree')}
          </p>
        </div>

        {/* Grid */}
        <div className="skins-grid">
          {SKINS.map(s => {
            const owned   = ownedSkins.includes(s.id)
            const selected = pieceSkin === s.id
            return (
              <button
                key={s.id}
                className={`skin-card ${selected ? 'selected' : ''} ${!owned ? 'skin-locked' : ''}`}
                onClick={() => handleClick(s.id)}
              >
                {/* Icon block */}
                <div className="skin-icon-block">
                  <KingIcon color={SKIN_COLOR[s.id]} size={34} />
                  {!owned && (
                    <span className="skin-lock-overlay"><LockIcon /></span>
                  )}
                </div>

                {/* Info */}
                <div className="skin-info">
                  <div className="skin-name">{s.label[lang]}</div>
                  <div className="skin-desc">{s.desc[lang]}</div>
                </div>

                {/* Status pill */}
                <div className={`skin-badge ${selected ? 'skin-badge-active' : owned ? 'skin-badge-owned' : 'skin-badge-pro'}`}>
                  {selected
                    ? <><CheckIcon /> {t('active')}</>
                    : owned
                      ? t('available')
                      : t('pro')
                  }
                </div>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="skins-modal-actions">
          {!isPro && (
            <button
              className="skins-unlock-btn"
              onClick={() => {
                closeSkinsShop()
                window.open(POLAR_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
              }}
            >
              {t('unlockPro')}
            </button>
          )}
          <button
            className={`skins-close-btn ${isPro ? 'skins-close-full' : ''}`}
            onClick={closeSkinsShop}
          >
            {t('close')}
          </button>
        </div>

      </div>
    </div>
  )
}
