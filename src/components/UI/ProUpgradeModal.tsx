import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
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

// ── Icons ────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Copy ─────────────────────────────────────────────────────────────
type T = Record<Lang, string>
const COPY: Record<string, T> = {
  title:         { en: 'CHESSVERSE PRO',          ru: 'CHESSVERSE PRO'                },
  subtitle:      { en: 'Advanced visual features', ru: 'Расширенные возможности'       },
  freeName:      { en: 'Free',                     ru: 'Бесплатно'                     },
  freePrice:     { en: '$0',                       ru: '$0'                            },
  freePeriod:    { en: 'forever',                  ru: 'навсегда'                      },
  proName:       { en: 'Pro',                      ru: 'Pro'                           },
  proPrice:      { en: '$4.99',                    ru: '$4.99'                         },
  proPeriod:     { en: 'per month',                ru: 'в месяц'                       },
  currentPlan:   { en: 'Current plan',             ru: 'Текущий план'                  },
  upgradePro:    { en: 'UPGRADE TO PRO',           ru: 'ПЕРЕЙТИ НА PRO'               },
  proActive:     { en: 'PRO ACTIVE',               ru: 'PRO АКТИВЕН'                  },
  dismiss:       { en: 'DISMISS',                  ru: 'ЗАКРЫТЬ'                      },
  disclaimer:    { en: 'Demo mode — payments not connected. Real billing is on the roadmap.',
                   ru: 'Деморежим — оплата не подключена. Реальный платёж — в roadmap.' },
}

const FREE_FEATURES: Record<Lang, string[]> = {
  en: [
    '3D board & classic pieces',
    'Stockfish (5 levels)',
    'Local & online play',
    'AI game analysis',
    'Local game history',
  ],
  ru: [
    '3D-доска и классические фигуры',
    'Stockfish (5 уровней)',
    'Локальная игра и онлайн',
    'AI-разбор партии',
    'Локальная история партий',
  ],
}

const PRO_FEATURES: Record<Lang, string[]> = {
  en: [
    'Everything in Free',
    '3 premium piece skins',
    'Gold, Marble & Neon materials',
    'Priority Stockfish analysis',
    'Pro badge in leaderboard',
  ],
  ru: [
    'Всё из бесплатного плана',
    '3 премиум-скина фигур',
    'Материалы Gold, Marble, Neon',
    'Приоритетный анализ Stockfish',
    'Бейдж Pro в лидерборде',
  ],
}

// ── Component ─────────────────────────────────────────────────────────
export function ProUpgradeModal() {
  const { showProUpgrade, closeProUpgrade, isPro } = useGameStore()

  const [lang, setLang] = useState<Lang>(() => getLang())
  useEffect(() => {
    const syncLang = () => setLang(getLang())
    window.addEventListener('cv-lang-change', syncLang)
    window.addEventListener('storage', syncLang)
    return () => {
      window.removeEventListener('cv-lang-change', syncLang)
      window.removeEventListener('storage', syncLang)
    }
  }, [])

  const t = (key: string) => COPY[key]?.[lang] ?? key

  if (!showProUpgrade) return null

  return (
    <div className="modal-overlay" onClick={closeProUpgrade}>
      <div className="pro-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pro-modal-header">
          <h2 className="pro-modal-title">{t('title')}</h2>
          <p className="pro-modal-subtitle">{t('subtitle')}</p>
        </div>

        {/* Tier cards */}
        <div className="pro-tier-grid">

          {/* Free */}
          <div className="pro-tier">
            <div className="pro-tier-name">{t('freeName')}</div>
            <div className="pro-tier-price">{t('freePrice')}</div>
            <div className="pro-tier-period">{t('freePeriod')}</div>
            <ul className="pro-tier-features">
              {FREE_FEATURES[lang].map((f, i) => (
                <li key={i}><CheckIcon />{f}</li>
              ))}
            </ul>
            <button className="pro-tier-btn pro-tier-btn-ghost" disabled>
              {t('currentPlan')}
            </button>
          </div>

          {/* Pro */}
          <div className="pro-tier pro-tier-featured">
            <div className="pro-tier-name">{t('proName')}</div>
            <div className="pro-tier-price">{t('proPrice')}</div>
            <div className="pro-tier-period">{t('proPeriod')}</div>
            <ul className="pro-tier-features">
              {PRO_FEATURES[lang].map((f, i) => (
                <li key={i}><CheckIcon />{f}</li>
              ))}
            </ul>
            <button
              className="pro-tier-btn pro-tier-btn-solid"
              onClick={() => window.open(POLAR_CHECKOUT_URL, '_blank', 'noopener,noreferrer')}
              disabled={isPro}
            >
              {isPro ? t('proActive') : t('upgradePro')}
            </button>
          </div>

        </div>

        {/* Close */}
        <div className="pro-modal-footer">
          <button className="pro-modal-dismiss" onClick={closeProUpgrade}>
            {t('dismiss')}
          </button>
        </div>

      </div>
    </div>
  )
}
