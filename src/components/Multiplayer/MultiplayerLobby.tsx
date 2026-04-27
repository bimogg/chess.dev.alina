import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getRoomFromUrl } from '../../utils/multiplayer'

export function MultiplayerLobby() {
  const {
    goToLanding, startHostedMultiplayer,
    hostMultiplayer, joinMultiplayer, leaveMultiplayer,
    mpStatus, mpRoomId, mpRoomLink, mpRole, mpAwaitingHostStart, mpError, profile, openAuthModal,
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
    if (!profile?.username?.trim()) {
      openAuthModal()
      return
    }
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
        <button className="setup-back" onClick={() => { leaveMultiplayer(); goToLanding() }}>← На главную</button>

        <div className="setup-header">
          <h2 className="setup-title">Онлайн-матч</h2>
          <p className="setup-subtitle">Игра по ссылке через Supabase Realtime</p>
        </div>

        <div className="mp-tabs">
          <button className={`mp-tab ${tab === 'host' ? 'active' : ''}`} onClick={() => setTab('host')}>Создать</button>
          <button className={`mp-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>Войти</button>
        </div>

        {tab === 'host' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
              Создайте комнату и отправьте ссылку другу.
              Комната синхронизирует ходы между устройствами. Вы играете <strong>белыми</strong>.
            </p>
            <button
              className="mp-host-action"
              onClick={() => {
                if (!profile?.username?.trim()) {
                  openAuthModal()
                  return
                }
                hostMultiplayer()
              }}
              disabled={mpStatus === 'hosting' || (mpAwaitingHostStart && mpRole === 'white')}
            >
              {mpStatus === 'hosting' && !mpRoomLink ? 'Создаю комнату…' : 'Создать комнату'}
            </button>

            {mpRoomLink && mpAwaitingHostStart && mpRole === 'white' && (
              <div className="mp-room-share">
                <div className="mp-room-share-label">Комната создана</div>
                <div className="mp-room-share-label">ID комнаты: {mpRoomId}</div>
                <div className="mp-room-link">
                  <input value={mpRoomLink} readOnly onFocus={(e) => e.target.select()} />
                  <button className="mp-room-copy" onClick={handleCopy}>
                    {copied ? '✓ Скопировано' : 'Скопировать ссылку'}
                  </button>
                </div>
                <div className="mp-room-status">
                  Отправьте ссылку другу. Он присоединится чёрными.
                </div>
                <button className="mp-host-action" onClick={startHostedMultiplayer}>
                  Начать белыми
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
              Вставьте ссылку-приглашение или код комнаты от друга.
              Вы играете <strong>чёрными</strong>.
            </p>
            <div className="mp-input-group">
              <div className="mp-input-label">Ссылка или код комнаты</div>
              <input
                className="mp-input"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="cv-xxxxxxxx или полная ссылка"
                autoFocus
              />
            </div>
            <button
              className="mp-host-action"
              onClick={handleJoin}
              disabled={!roomInput.trim() || mpStatus === 'joining'}
            >
              {mpStatus === 'joining' ? 'Подключение…' : 'Войти в матч'}
            </button>
          </div>
        )}

        {mpError && <div className="mp-error">{mpError}</div>}

        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
          Игра по ссылке через Supabase Realtime · Комната синхронизирует ходы между устройствами
        </div>
      </div>
    </div>
  )
}
