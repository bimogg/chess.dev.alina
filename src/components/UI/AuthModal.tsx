import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isSupabaseEnabled } from '../../utils/supabase'

export function AuthModal() {
  const { showAuthModal, closeAuthModal, setLocalProfile, refreshProfile } = useGameStore()

  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!showAuthModal) return null

  const supabaseAvailable = isSupabaseEnabled()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!username.trim()) { setError('Введите никнейм'); setLoading(false); return }
      setLocalProfile(username.trim(), city.trim())
      await refreshProfile()
      closeAuthModal()
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-title">Быстрый старт</div>
        <div className="modal-subtitle">
          Профиль создаётся локально (guest/clientId), статистика сохраняется на устройстве.
        </div>

        <div className="auth-tabs">
          <button className="auth-tab active">Гость</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mp-input-group">
            <div className="mp-input-label">Никнейм</div>
            <input className="mp-input" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Игрок" />
          </div>
          <div className="mp-input-group">
            <div className="mp-input-label">Город (для лидерборда)</div>
            <input className="mp-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Алматы" />
          </div>

          {error && <div className="mp-error">{error}</div>}

          <button type="submit" className="mp-host-action" disabled={loading} style={{ marginTop: 10 }}>
            {loading ? 'Сохраняю…' : 'Начать игру'}
          </button>
        </form>

        {!supabaseAvailable && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            Supabase не настроен — доступен только гостевой режим.<br />
            Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env для облачной синхронизации.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button className="modal-close-btn" onClick={closeAuthModal}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
