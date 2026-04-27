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
      if (!username.trim()) { setError('Pick a username'); setLoading(false); return }
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
        <div className="modal-title">Quick play</div>
        <div className="modal-subtitle">
          Save your stats locally and appear on the leaderboard.
        </div>

        <div className="auth-tabs">
          <button className="auth-tab active">Guest</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mp-input-group">
            <div className="mp-input-label">Username</div>
            <input className="mp-input" required value={username} onChange={e => setUsername(e.target.value)} placeholder="MagnusJr" />
          </div>
          <div className="mp-input-group">
            <div className="mp-input-label">City (for leaderboard)</div>
            <input className="mp-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Almaty" />
          </div>

          {error && <div className="mp-error">{error}</div>}

          <button type="submit" className="mp-host-action" disabled={loading} style={{ marginTop: 10 }}>
            {loading ? 'Working…' : 'Start playing'}
          </button>
        </form>

        {!supabaseAvailable && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            Supabase isn't configured — only guest mode is available.<br />
            Add VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to .env to enable cloud accounts.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button className="modal-close-btn" onClick={closeAuthModal}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
