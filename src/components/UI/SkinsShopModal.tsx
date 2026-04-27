import { useGameStore } from '../../store/gameStore'
import { PieceSkin } from '../../types'

const SKINS: { id: PieceSkin; label: string; description: string; pro: boolean; icon: string }[] = [
  { id: 'classic', label: 'Classic',  description: 'Timeless ivory & ebony',         pro: false, icon: '♔' },
  { id: 'gold',    label: 'Gold',     description: 'Polished metallic gold',          pro: true,  icon: '♕' },
  { id: 'marble',  label: 'Marble',   description: 'Cool stone with veined shine',    pro: true,  icon: '♖' },
  { id: 'neon',    label: 'Neon',     description: 'Cyberpunk glow, emissive',        pro: true,  icon: '♗' },
]

export function SkinsShopModal() {
  const {
    showSkinsShop, closeSkinsShop,
    pieceSkin, ownedSkins, setPieceSkin,
    isPro, openProUpgrade,
  } = useGameStore()

  if (!showSkinsShop) return null

  const handleClick = (s: PieceSkin) => {
    if (ownedSkins.includes(s)) {
      setPieceSkin(s)
    } else {
      // Need Pro to unlock
      closeSkinsShop()
      openProUpgrade()
    }
  }

  return (
    <div className="modal-overlay" onClick={closeSkinsShop}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Piece Skins</div>
        <div className="modal-subtitle">
          {isPro
            ? 'You own all skins. Tap to switch.'
            : 'Premium skins are part of ChessFlow Pro.'}
        </div>

        <div className="skins-grid">
          {SKINS.map(s => {
            const owned = ownedSkins.includes(s.id)
            const selected = pieceSkin === s.id
            return (
              <button
                key={s.id}
                className={`skin-card ${selected ? 'selected' : ''}`}
                onClick={() => handleClick(s.id)}
                style={{ cursor: 'pointer' }}
              >
                {s.pro && <span className="skin-pro-badge">PRO</span>}
                <div className={`skin-preview ${s.id}`}>{s.icon}</div>
                <div className="skin-name">{s.label}</div>
                <div className={`skin-status ${owned ? 'owned' : 'locked'}`}>
                  {owned ? (selected ? '✓ Selected' : 'Owned') : 'Pro only'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                  {s.description}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {!isPro && (
            <button className="pro-cta-btn" style={{ width: 'auto', padding: '8px 18px' }} onClick={() => { closeSkinsShop(); openProUpgrade() }}>
              ★ Get Pro to unlock
            </button>
          )}
          <button className="modal-close-btn" onClick={closeSkinsShop}>Close</button>
        </div>
      </div>
    </div>
  )
}
