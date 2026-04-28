import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LeaderboardEntry } from '../../types'
import { isSupabaseEnabled, getGlobalLeaderboard, getCityLeaderboard, getCities } from '../../utils/supabase'

// ── Language ──────────────────────────────────────────────────────────
type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}
const COPY: Record<string, Record<Lang, string>> = {
  back:     { en: 'Back',           ru: 'На главную'   },
  title:    { en: 'LEADERBOARD',    ru: 'ЛИДЕРБОРД'    },
  all:      { en: 'All cities',     ru: 'Все города'   },
  rank:     { en: 'RANK',           ru: 'МЕСТО'        },
  player:   { en: 'PLAYER',         ru: 'ИГРОК'        },
  city:     { en: 'CITY',           ru: 'ГОРОД'        },
  elo:      { en: 'ELO',            ru: 'ELO'          },
  wins:     { en: 'WINS',           ru: 'ПОБЕДЫ'       },
  loading:  { en: 'Loading…',       ru: 'Загрузка…'    },
  empty:    { en: 'No players yet — be the first!',
              ru: 'Пока нет игроков — станьте первым!' },
  you:      { en: 'YOU',            ru: 'ВЫ'           },
  pro:      { en: 'PRO',            ru: 'PRO'          },
}

// ── Icons ─────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconGlobe = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconPin = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

// ── Demo data ─────────────────────────────────────────────────────────
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { username: 'MagnusJr',       city: 'Almaty',    elo: 2210, wins: 142, isPro: true  },
  { username: 'Hikaru_AI',      city: 'Almaty',    elo: 2087, wins: 98,  isPro: true  },
  { username: 'pawn_storm',     city: 'Astana',    elo: 1923, wins: 76,  isPro: false },
  { username: 'queen_sac_99',   city: 'Almaty',    elo: 1854, wins: 61,  isPro: false },
  { username: 'silent_rook',    city: 'Shymkent',  elo: 1799, wins: 53,  isPro: true  },
  { username: 'endgame_andrey', city: 'Astana',    elo: 1742, wins: 47,  isPro: false },
  { username: 'opening_book',   city: 'Almaty',    elo: 1688, wins: 41,  isPro: false },
  { username: 'fianchetto',     city: 'Astana',    elo: 1611, wins: 35,  isPro: false },
  { username: 'zugzwang_zoe',   city: 'Karaganda', elo: 1567, wins: 30,  isPro: false },
  { username: 'black_knight',   city: 'Almaty',    elo: 1502, wins: 24,  isPro: false },
]

// rank emphasis: 0→gold, 1→silver, 2→bronze, else dim
const RANK_CLASS = ['lb-rank--1', 'lb-rank--2', 'lb-rank--3']
const RANK_LABEL = ['01', '02', '03']

export function LeaderboardScreen() {
  const { goToLanding, profile } = useGameStore()
  const [filter, setFilter]     = useState<'global' | string>('global')
  const [cities, setCities]     = useState<string[]>([])
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [lang, setLang]         = useState<Lang>(() => getLang())

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
  const supabaseAvailable = isSupabaseEnabled()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      if (supabaseAvailable) {
        const [remoteList, cityList] = await Promise.all([
          filter === 'global' ? getGlobalLeaderboard() : getCityLeaderboard(filter),
          getCities(),
        ])
        let list = [...remoteList]
        if (list.length === 0) {
          list = [...DEMO_LEADERBOARD]
          if (filter !== 'global') list = list.filter(e => e.city === filter)
          list.sort((a, b) => b.elo - a.elo)
        }
        if (cancelled) return
        setEntries(list)
        const fallback = Array.from(new Set(DEMO_LEADERBOARD.map(e => e.city).filter(Boolean))).sort()
        setCities(cityList.length > 0 ? cityList : fallback)
      } else {
        let list = [...DEMO_LEADERBOARD]
        if (profile) list.push({ username: profile.username, city: profile.city || 'Unknown', elo: profile.elo, wins: profile.wins, isPro: profile.isPro })
        const cityList = Array.from(new Set(list.map(e => e.city).filter(Boolean))).sort()
        if (filter !== 'global') list = list.filter(e => e.city === filter)
        list.sort((a, b) => b.elo - a.elo)
        setEntries(list)
        setCities(cityList)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [filter, supabaseAvailable, profile])

  const allCities = Array.from(
    new Map(
      cities
        .filter(Boolean)
        .map(c => [c.trim().toLowerCase(), c.trim()] as const)
    ).values()
  )

  useEffect(() => {
    if (filter !== 'global' && !allCities.includes(filter)) {
      setFilter('global')
    }
  }, [filter, allCities])

  return (
    <div className="lb-page">
      <div className="lb-inner">

        {/* Back */}
        <button className="lb-back" onClick={goToLanding}>
          <IconArrowLeft /> {t('back')}
        </button>

        {/* Header */}
        <div className="lb-header">
          <h1 className="lb-title">{t('title')}</h1>
        </div>

        {/* Filters */}
        <div className="lb-filters">
          <button
            className={`lb-filter ${filter === 'global' ? 'active' : ''}`}
            onClick={() => setFilter('global')}
          >
            <IconGlobe /> {t('all')}
          </button>
          {allCities.map(city => (
            <button
              key={city}
              className={`lb-filter ${filter === city ? 'active' : ''}`}
              onClick={() => setFilter(city)}
            >
              <IconPin /> {city}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="lb-table">
          {/* Header row */}
          <div className="lb-row lb-row-header">
            <div>{t('rank')}</div>
            <div>{t('player')}</div>
            <div>{t('city')}</div>
            <div>{t('elo')}</div>
            <div>{t('wins')}</div>
          </div>

          {loading && (
            <div className="lb-empty">{t('loading')}</div>
          )}
          {!loading && entries.length === 0 && (
            <div className="lb-empty">{t('empty')}</div>
          )}

          {!loading && entries.map((e, i) => {
            const isMe = !!profile && e.username === profile.username
            const rankCls = RANK_CLASS[i] ?? ''
            return (
              <div key={i + e.username} className={`lb-row ${isMe ? 'lb-row-me' : ''}`}>
                {/* Rank */}
                <div className={`lb-rank ${rankCls}`}>
                  {i < 3 ? RANK_LABEL[i] : `${i + 1}`}
                </div>

                {/* Player */}
                <div className="lb-player">
                  <div className="lb-avatar">{e.username[0].toUpperCase()}</div>
                  <div className="lb-player-info">
                    <span className="lb-username">{e.username}</span>
                    <div className="lb-badges">
                      {e.isPro && <span className="lb-badge-pro">{t('pro')}</span>}
                      {isMe   && <span className="lb-badge-me">{t('you')}</span>}
                    </div>
                  </div>
                </div>

                {/* City */}
                <div className="lb-city">{e.city || '—'}</div>

                {/* ELO */}
                <div className={`lb-elo ${i < 3 ? 'lb-elo-top' : ''}`}>{e.elo}</div>

                {/* Wins */}
                <div className="lb-wins">{e.wins}</div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
