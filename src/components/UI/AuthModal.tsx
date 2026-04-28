import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isSupabaseEnabled } from '../../utils/supabase'

export function AuthModal() {
  const { showAuthModal, closeAuthModal, setLocalProfile, refreshProfile } = useGameStore()

  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uiLang, setUiLang] = useState<'en' | 'ru'>(() => {
    if (typeof window === 'undefined') return 'en'
    const s = window.localStorage.getItem('cv_lang')
    if (s === 'ru' || s === 'en') return s
    const a = document.documentElement.getAttribute('data-ui-lang')
    return a === 'ru' ? 'ru' : 'en'
  })

  if (!showAuthModal) return null

  const supabaseAvailable = isSupabaseEnabled()
  const isRu = uiLang === 'ru'
  const T = {
    title: isRu ? 'Быстрый старт' : 'Quick Start',
    subtitle: isRu
      ? 'Профиль создаётся локально (guest/clientId), статистика сохраняется на устройстве.'
      : 'Profile is created locally (guest/clientId), stats are saved on this device.',
    guest: isRu ? 'Гость' : 'Guest',
    nickname: isRu ? 'Никнейм' : 'Nickname',
    city: isRu ? 'Город' : 'City',
    cityHint: isRu ? 'Город (для лидерборда)' : 'City (for leaderboard)',
    nicknamePlaceholder: isRu ? 'Игрок' : 'Player',
    cityPlaceholder: isRu ? 'Алматы' : 'Almaty',
    requiredNickname: isRu ? 'Введите никнейм' : 'Enter a nickname',
    saving: isRu ? 'Сохраняю…' : 'Saving…',
    start: isRu ? 'Начать игру' : 'Start Game',
    close: isRu ? 'Закрыть' : 'Close',
    supabaseOff: isRu
      ? 'Supabase не настроен — доступен только гостевой режим.'
      : 'Supabase is not configured — guest mode only.',
    supabaseEnv: isRu
      ? 'Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env для облачной синхронизации.'
      : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env for cloud sync.',
  } as const

  useEffect(() => {
    const syncLang = () => {
      const s = window.localStorage.getItem('cv_lang')
      if (s === 'ru' || s === 'en') setUiLang(s)
      else setUiLang(document.documentElement.getAttribute('data-ui-lang') === 'ru' ? 'ru' : 'en')
    }
    window.addEventListener('cv-lang-change', syncLang)
    window.addEventListener('storage', syncLang)
    return () => {
      window.removeEventListener('cv-lang-change', syncLang)
      window.removeEventListener('storage', syncLang)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!username.trim()) { setError(T.requiredNickname); setLoading(false); return }
      setLocalProfile(username.trim(), city.trim())
      await refreshProfile()
      closeAuthModal()
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay auth-quickstart-overlay" onClick={closeAuthModal}>
      <div className="modal-card auth-quickstart-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-title">{T.title}</div>
        <div className="modal-subtitle">{T.subtitle}</div>

        <form onSubmit={handleSubmit}>
          <div className="mp-input-group">
            <div className="mp-input-label">{T.nickname}</div>
            <input className="mp-input" required value={username} onChange={e => setUsername(e.target.value)} placeholder={T.nicknamePlaceholder} />
          </div>
          <div className="mp-input-group">
            <div className="mp-input-label">{T.cityHint}</div>
            <input className="mp-input" value={city} onChange={e => setCity(e.target.value)} placeholder={T.cityPlaceholder} />
          </div>

          {error && <div className="mp-error">{error}</div>}

          <button type="submit" className="mp-host-action" disabled={loading} style={{ marginTop: 10 }}>
            {loading ? T.saving : T.start}
          </button>
        </form>

        {!supabaseAvailable && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            {T.supabaseOff}<br />
            {T.supabaseEnv}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button className="modal-close-btn" onClick={closeAuthModal}>{T.close}</button>
        </div>
      </div>
    </div>
  )
}
