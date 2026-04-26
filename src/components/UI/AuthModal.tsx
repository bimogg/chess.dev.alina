import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { isSupabaseEnabled, signInWithEmail, signUpWithEmail } from '../../utils/supabase'

type Mode = 'signin' | 'signup' | 'guest'

export function AuthModal() {
  const { showAuthModal, closeAuthModal, setLocalProfile, refreshProfile } = useGameStore()

  const [mode, setMode] = useState<Mode>(isSupabaseEnabled() ? 'signin' : 'guest')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      if (mode === 'guest') {
        if (!username.trim()) { setError('Pick a username'); setLoading(false); return }
        setLocalProfile(username.trim(), city.trim())
        setLoading(false)
        return
      }
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password)
        if (error) throw error
      } else {
        if (!username.trim()) { setError('Pick a username'); setLoading(false); return }
        const { error } = await signUpWithEmail(email, password, username.trim())
        if (error) throw error
      }
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
        <div className="modal-title">{mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Quick play'}</div>
        <div className="modal-subtitle">
          {mode === 'guest'
            ? 'Save your stats locally and appear on the leaderboard.'
            : 'Sync your progress, ELO and skins across devices.'}
        </div>

        <div className="auth-tabs">
          {supabaseAvailable && (
            <>
              <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>Sign in</button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign up</button>
            </>
          )}
          <button className={`auth-tab ${mode === 'guest' ? 'active' : ''}`} onClick={() => setMode('guest')}>Guest</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode !== 'guest' && (
            <>
              <div className="mp-input-group">
                <div className="mp-input-label">Email</div>
                <input className="mp-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mp-input-group">
                <div className="mp-input-label">Password</div>
                <input className="mp-input" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </>
          )}
          {(mode === 'signup' || mode === 'guest') && (
            <>
              <div className="mp-input-group">
                <div className="mp-input-label">Username</div>
                <input className="mp-input" required value={username} onChange={e => setUsername(e.target.value)} placeholder="MagnusJr" />
              </div>
              <div className="mp-input-group">
                <div className="mp-input-label">City (for leaderboard)</div>
                <input className="mp-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Almaty" />
              </div>
            </>
          )}

          {error && <div className="mp-error">{error}</div>}

          <button type="submit" className="mp-host-action" disabled={loading} style={{ marginTop: 10 }}>
            {loading ? 'Working…' : mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Start playing'}
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
