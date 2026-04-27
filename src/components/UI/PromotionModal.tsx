import { useGameStore } from '../../store/gameStore'

const PIECES = [
  { type: 'q', name: 'Queen', symbol: '♛' },
  { type: 'r', name: 'Rook', symbol: '♜' },
  { type: 'b', name: 'Bishop', symbol: '♝' },
  { type: 'n', name: 'Knight', symbol: '♞' },
]

export function PromotionModal() {
  const { promotionPending, completePromotion, mpStatus, mpError } = useGameStore()
  if (!promotionPending) return null

  return (
    <div className="promotion-overlay">
      <div className="promotion-modal">
        <div className="promotion-title">Pawn Promotion</div>
        <div className="promotion-subtitle">Choose a piece to promote to</div>
        <div className="promotion-pieces">
          {PIECES.map(p => (
            <button
              key={p.type}
              className="promotion-piece-btn"
              disabled={mpStatus === 'hosting'}
              onClick={() => completePromotion(p.type)}
            >
              <span className="promotion-piece-icon">{p.symbol}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        {mpStatus === 'hosting' && <div className="promotion-subtitle">Applying move...</div>}
        {mpError && <div className="promotion-subtitle" style={{ color: '#ff6b6b' }}>{mpError}</div>}
      </div>
    </div>
  )
}
