import { useGameStore } from '../../store/gameStore'

export function MoveHistory() {
  const { chess } = useGameStore()
  const history = chess.history()

  const pairs: Array<{ num: number; white: string; black?: string }> = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ num: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] })
  }

  if (pairs.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>No moves yet</div>
  }

  const lastIdx = history.length - 1

  return (
    <div className="move-history">
      {pairs.map(pair => (
        <div key={pair.num} className="move-row">
          <span className="move-num">{pair.num}.</span>
          <span className={`move-san white-move ${lastIdx % 2 === 0 && pair.num === pairs.length ? 'last-move' : ''}`}>
            {pair.white}
          </span>
          {pair.black && (
            <span className={`move-san ${lastIdx % 2 === 1 && pair.num === pairs.length ? 'last-move' : ''}`}>
              {pair.black}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
