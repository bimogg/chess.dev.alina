import { useGameStore } from '../../store/gameStore'
import { PIECE_SYMBOLS } from '../../utils/chess'

const ORDER = ['q', 'r', 'b', 'n', 'p']

export function CapturedPieces() {
  const { capturedPieces } = useGameStore()

  const sort = (pieces: string[]) =>
    [...pieces].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))

  return (
    <div>
      <div className="captured-row">
        <span className="captured-label" style={{ color: '#e8d9c0' }}>White</span>
        <div className="captured-pieces">
          {sort(capturedPieces.w).map((p, i) => (
            <span key={i} className="captured-piece">{PIECE_SYMBOLS[p]?.b || '♟'}</span>
          ))}
        </div>
      </div>
      <div className="captured-row">
        <span className="captured-label" style={{ color: '#8b949e' }}>Black</span>
        <div className="captured-pieces">
          {sort(capturedPieces.b).map((p, i) => (
            <span key={i} className="captured-piece" style={{ filter: 'invert(0.8)' }}>{PIECE_SYMBOLS[p]?.w || '♙'}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
