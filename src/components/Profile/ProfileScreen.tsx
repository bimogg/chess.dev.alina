import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { POLAR_CHECKOUT_URL } from '../../constants/polar'

// ── Language ──────────────────────────────────────────────────────────
type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

// ── Icons ─────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconUser = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconLogOut = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Copy ──────────────────────────────────────────────────────────────
const COPY: Record<string, Record<Lang, string>> = {
  back:          { en: 'Back',                      ru: 'На главную'                     },
  title:         { en: 'PROFILE',                   ru: 'ПРОФИЛЬ'                        },
  sub:           { en: 'Your stats, ELO and account status.',
                   ru: 'Ваша статистика, ELO и статус аккаунта.'                         },
  noProfile:     { en: 'No profile yet',            ru: 'Профиль не создан'              },
  noProfileDesc: { en: 'Create a guest profile to track your ELO and appear on the leaderboard.',
                   ru: 'Создайте гостевой профиль, чтобы сохранять ELO и участвовать в лидерборде.' },
  createProfile: { en: 'Create Profile',            ru: 'Создать профиль'                },
  noCity:        { en: 'City not set',              ru: 'Город не указан'                },
  member:        { en: 'Member since today',        ru: 'Участник с сегодня'             },
  elo:           { en: 'ELO',                       ru: 'ELO'                            },
  games:         { en: 'GAMES',                     ru: 'ПАРТИИ'                         },
  wins:          { en: 'WINS',                      ru: 'ПОБЕДЫ'                         },
  winrate:       { en: 'WIN RATE',                  ru: 'ВИНРЕЙТ'                        },
  proTitle:      { en: 'UPGRADE TO PRO',            ru: 'ПЕРЕЙТИ НА PRO'                 },
  proDesc:       { en: 'Unlock 3 premium piece skins (Gold, Marble, Neon), priority Stockfish analysis, and a Pro badge on the leaderboard.',
                   ru: 'Откройте 3 премиум-скина фигур (Gold, Marble, Neon), приоритетный анализ Stockfish и бейдж Pro в лидерборде.' },
  proBtn:        { en: 'View Plans',                ru: 'Посмотреть планы'               },
  proFeature1:   { en: '3 premium piece skins',     ru: '3 премиум-скина фигур'          },
  proFeature2:   { en: 'Priority analysis',         ru: 'Приоритетный анализ'            },
  proFeature3:   { en: 'Pro badge in leaderboard',  ru: 'Бейдж Pro в лидерборде'         },
  signOut:       { en: 'Sign Out',                  ru: 'Выйти'                          },
  pro:           { en: 'PRO',                       ru: 'PRO'                            },
}

// ── Component ─────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { profile, goToLanding, signOut, openAuthModal, isPro } = useGameStore()

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

  const t = (k: string) => COPY[k]?.[lang] ?? k

  const handleSignOut = async () => {
    await signOut()
    goToLanding()
  }

  const winRate = profile && profile.gamesPlayed > 0
    ? Math.round((profile.wins / profile.gamesPlayed) * 100)
    : 0

  return (
    <div className="pf-page">
      <div className="pf-inner">

        {/* Back */}
        <button className="pf-back" onClick={goToLanding}>
          <IconArrowLeft /> {t('back')}
        </button>

        {/* Header */}
        <h1 className="pf-title">{t('title')}</h1>
        <p className="pf-sub">{t('sub')}</p>

        {!profile ? (
          /* ── Empty state ── */
          <div className="pf-card pf-empty">
            <div className="pf-empty-icon"><IconUser /></div>
            <div className="pf-empty-heading">{t('noProfile')}</div>
            <div className="pf-empty-desc">{t('noProfileDesc')}</div>
            <button className="pf-create-btn" onClick={openAuthModal}>
              {t('createProfile')}
            </button>
          </div>
        ) : (
          <>
            {/* ── Identity card ── */}
            <div className="pf-card">
              <div className="pf-identity">
                <div className="pf-avatar">{profile.username[0]?.toUpperCase() ?? 'P'}</div>
                <div className="pf-identity-info">
                  <div className="pf-username">
                    {profile.username}
                    {isPro && <span className="pf-badge-pro">{t('pro')}</span>}
                  </div>
                  <div className="pf-meta">
                    {profile.city
                      ? <><IconMapPin />{profile.city}</>
                      : t('noCity')
                    }
                    <span className="pf-meta-sep">·</span>
                    {t('member')}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="pf-stats">
                <div className="pf-stat">
                  <div className="pf-stat-val">{profile.elo}</div>
                  <div className="pf-stat-label">{t('elo')}</div>
                </div>
                <div className="pf-stat">
                  <div className="pf-stat-val">{profile.gamesPlayed}</div>
                  <div className="pf-stat-label">{t('games')}</div>
                </div>
                <div className="pf-stat">
                  <div className="pf-stat-val">{profile.wins}</div>
                  <div className="pf-stat-label">{t('wins')}</div>
                </div>
                <div className="pf-stat">
                  <div className="pf-stat-val">{winRate}%</div>
                  <div className="pf-stat-label">{t('winrate')}</div>
                </div>
              </div>
            </div>

            {/* ── Pro CTA ── */}
            {!isPro && (
              <div className="pf-card pf-pro-cta">
                <div className="pf-pro-cta-icon"><IconZap /></div>
                <div className="pf-pro-cta-body">
                  <div className="pf-pro-cta-title">{t('proTitle')}</div>
                  <div className="pf-pro-cta-desc">{t('proDesc')}</div>
                  <ul className="pf-pro-features">
                    <li><IconCheck />{t('proFeature1')}</li>
                    <li><IconCheck />{t('proFeature2')}</li>
                    <li><IconCheck />{t('proFeature3')}</li>
                  </ul>
                </div>
                <button
                  className="pf-pro-btn"
                  onClick={() => window.open(POLAR_CHECKOUT_URL, '_blank', 'noopener,noreferrer')}
                >
                  {t('proBtn')}
                </button>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="pf-actions">
              <button className="pf-signout-btn" onClick={handleSignOut}>
                <IconLogOut /> {t('signOut')}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
