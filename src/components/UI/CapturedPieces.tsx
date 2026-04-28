import { useGameStore } from '../../store/gameStore'
import { PIECE_SYMBOLS } from '../../utils/chess'

type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

const ORDER = ['q', 'r', 'b', 'n', 'p']

export function CapturedPieces() {
  const { capturedPieces } = useGameStore()
  const lang = getLang()

  const sort = (pieces: string[]) =>
    [...pieces].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))

  return (
    <div>
      <div className="captured-row">
        <span className="captured-label" style={{ color: '#e8d9c0' }}>{lang === 'ru' ? 'Белые:' : 'White:'}</span>
        <div className="captured-pieces">
          {sort(capturedPieces.w).map((p, i) => (
            <span key={i} className="captured-piece">{PIECE_SYMBOLS[p]?.b || '♟'}</span>
          ))}
        </div>
      </div>
      <div className="captured-row">
        <span className="captured-label" style={{ color: '#8b949e' }}>{lang === 'ru' ? 'Чёрные:' : 'Black:'}</span>
        <div className="captured-pieces">
          {sort(capturedPieces.b).map((p, i) => (
            <span key={i} className="captured-piece" style={{ filter: 'invert(0.8)' }}>{PIECE_SYMBOLS[p]?.w || '♙'}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
