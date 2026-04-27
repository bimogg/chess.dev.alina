import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LeaderboardEntry } from '../../types'
import { isSupabaseEnabled, getGlobalLeaderboard, getCityLeaderboard, getCities } from '../../utils/supabase'

// Demo seed data for local-only mode (when Supabase not configured)
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { username: 'MagnusJr',      city: 'Almaty',   elo: 2210, wins: 142, isPro: true  },
  { username: 'Hikaru_AI',     city: 'Almaty',   elo: 2087, wins: 98,  isPro: true  },
  { username: 'pawn_storm',    city: 'Astana',   elo: 1923, wins: 76,  isPro: false },
  { username: 'queen_sac_99',  city: 'Almaty',   elo: 1854, wins: 61,  isPro: false },
  { username: 'silent_rook',   city: 'Shymkent', elo: 1799, wins: 53,  isPro: true  },
  { username: 'endgame_andrey',city: 'Astana',   elo: 1742, wins: 47,  isPro: false },
  { username: 'opening_book',  city: 'Almaty',   elo: 1688, wins: 41,  isPro: false },
  { username: 'fianchetto',    city: 'Astana',   elo: 1611, wins: 35,  isPro: false },
  { username: 'zugzwang_zoe',  city: 'Karaganda',elo: 1567, wins: 30,  isPro: false },
  { username: 'black_knight',  city: 'Almaty',   elo: 1502, wins: 24,  isPro: false },
]

export function LeaderboardScreen() {
  const { goToLanding, profile } = useGameStore()
  const [filter, setFilter] = useState<'global' | string>('global')
  const [cities, setCities] = useState<string[]>([])
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

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
        // If remote leaderboard is still empty, show demo seed so the UI
        // doesn't look broken during early testing.
        let list = [...remoteList]
        if (list.length === 0) {
          list = [...DEMO_LEADERBOARD]
          if (filter !== 'global') list = list.filter(e => e.city === filter)
          list.sort((a, b) => b.elo - a.elo)
        }
        if (cancelled) return
        setEntries(list)
        const fallbackCities = Array.from(new Set(DEMO_LEADERBOARD.map(e => e.city).filter(Boolean))).sort()
        setCities(cityList.length > 0 ? cityList : fallbackCities)
      } else {
        // Demo mode: use seed + insert local profile if exists
        let list = [...DEMO_LEADERBOARD]
        if (profile) {
          list.push({
            username: profile.username,
            city: profile.city || 'Unknown',
            elo: profile.elo,
            wins: profile.wins,
            isPro: profile.isPro,
          })
        }
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

  const allCities = profile?.city && !cities.includes(profile.city) ? [...cities, profile.city] : cities

  return (
    <div className="screen-page">
      <div className="screen-page-inner">
        <button className="screen-page-back" onClick={goToLanding}>← На главную</button>
        <div className="screen-page-title">Лидерборд</div>
        <div className="screen-page-sub"></div>

        <div className="leaderboard-filters">
          <button className={`leaderboard-filter ${filter === 'global' ? 'active' : ''}`} onClick={() => setFilter('global')}>
            🌍 Все города
          </button>
          {allCities.map(city => (
            <button key={city} className={`leaderboard-filter ${filter === city ? 'active' : ''}`} onClick={() => setFilter(city)}>
              📍 {city}
            </button>
          ))}
        </div>

        <div className="leaderboard-table">
          <div className="leaderboard-row header">
            <div>МЕСТО</div>
            <div>ИГРОК</div>
            <div>ГОРОД</div>
            <div>ELO</div>
            <div>ПОБЕДЫ</div>
          </div>
          {loading && <div className="empty-state">Загрузка…</div>}
          {!loading && entries.length === 0 && <div className="empty-state">Пока нет игроков — станьте первым!</div>}
          {!loading && entries.map((e, i) => {
            const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
            const isMe = profile && e.username === profile.username
            return (
              <div key={i + e.username} className={`leaderboard-row ${isMe ? 'is-me' : ''}`}>
                <div className={`leaderboard-rank ${rankClass}`}>#{i + 1}</div>
                <div className="leaderboard-name">
                  {e.username}
                  {e.isPro && <span className="badge-pro">PRO</span>}
                  {isMe && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>(ВЫ)</span>}
                </div>
                <div className="leaderboard-city">{e.city || '—'}</div>
                <div className="leaderboard-elo">{e.elo}</div>
                <div className="leaderboard-wins">{e.wins}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
