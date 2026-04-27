import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getRoomFromUrl } from '../../utils/multiplayer'

export function MultiplayerLobby() {
  const {
    goToLanding, startHostedMultiplayer,
    hostMultiplayer, joinMultiplayer, leaveMultiplayer,
    mpStatus, mpRoomId, mpRoomLink, mpRole, mpAwaitingHostStart, mpError,
  } = useGameStore()

  const [tab, setTab] = useState<'host' | 'join'>('host')
  const [roomInput, setRoomInput] = useState('')
  const [copied, setCopied] = useState(false)

  // Auto-fill room from URL
  useEffect(() => {
    const room = getRoomFromUrl()
    if (room) {
      setTab('join')
      setRoomInput(room)
    }
  }, [])

  const handleCopy = () => {
    if (!mpRoomLink) return
    navigator.clipboard?.writeText(mpRoomLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleJoin = () => {
    const cleaned = roomInput.trim()
    if (!cleaned) return
    // Accept both bare room id and full URL
    let room = cleaned
    try {
      const url = new URL(cleaned)
      const fromPath = url.pathname.match(/\/room\/([^/]+)/)?.[1]
      room = fromPath ?? url.searchParams.get('room') ?? cleaned
    } catch { /* not a URL, use as-is */ }
    joinMultiplayer(room)
  }

  return (
    <div className="mp-lobby">
      <div className="mp-lobby-card">
        <button className="setup-back" onClick={() => { leaveMultiplayer(); goToLanding() }}>← Back to Home</button>

        <div className="setup-header">
          <h2 className="setup-title">Online Match</h2>
          <p className="setup-subtitle">Supabase realtime room sync</p>
        </div>

        <div className="mp-tabs">
          <button className={`mp-tab ${tab === 'host' ? 'active' : ''}`} onClick={() => setTab('host')}>Host</button>
          <button className={`mp-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>Join</button>
        </div>

        {tab === 'host' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
              Create a room and share the link. Your friend opens it and you start playing instantly.
              You'll play <strong>White</strong>.
            </p>
            <button
              className="mp-host-action"
              onClick={hostMultiplayer}
              disabled={mpStatus === 'hosting' || (mpAwaitingHostStart && mpRole === 'white')}
            >
              {mpStatus === 'hosting' && !mpRoomLink ? 'Creating room…' : 'Create Room'}
            </button>

            {mpRoomLink && mpAwaitingHostStart && mpRole === 'white' && (
              <div className="mp-room-share">
                <div className="mp-room-share-label">Room created</div>
                <div className="mp-room-share-label">Room ID: {mpRoomId}</div>
                <div className="mp-room-link">
                  <input value={mpRoomLink} readOnly onFocus={(e) => e.target.select()} />
                  <button className="mp-room-copy" onClick={handleCopy}>
                    {copied ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
                <div className="mp-room-status">
                  Send this link to your friend. They will join as Black.
                </div>
                <button className="mp-host-action" onClick={startHostedMultiplayer}>
                  Start as White
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
              Paste the invite link or room code from your friend.
              You'll play <strong>Black</strong>.
            </p>
            <div className="mp-input-group">
              <div className="mp-input-label">Invite link or code</div>
              <input
                className="mp-input"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="cv-xxxxxxxx or full URL"
                autoFocus
              />
            </div>
            <button
              className="mp-host-action"
              onClick={handleJoin}
              disabled={!roomInput.trim() || mpStatus === 'joining'}
            >
              {mpStatus === 'joining' ? 'Connecting…' : 'Join Match'}
            </button>
          </div>
        )}

        {mpError && <div className="mp-error">{mpError}</div>}

        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
          Powered by PeerJS · WebRTC peer-to-peer · Your moves never touch our servers
        </div>
      </div>
    </div>
  )
}
