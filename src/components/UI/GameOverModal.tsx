import { useGameStore } from '../../store/gameStore'

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h} ч ${m} мин ${s} сек`
  if (m > 0) return `${m} мин ${s} сек`
  return `${s} сек`
}

export function GameOverModal() {
  const {
    showGameOver, closeGameOver,
    gameStatus, chess, gameStartedAt, gameEndedAt,
    gameMode, playerColor, difficulty, mpRole,
    runCoachAnalysis, coachAnalyzing, resetGame, goToSetup,
  } = useGameStore()

  if (!showGameOver) return null

  // Determine winner
  // In checkmate, the side WHOSE TURN IT IS lost (because they have no legal moves).
  const losingSide = chess.turn() // 'w' or 'b' — only meaningful for checkmate
  const winnerSide: 'w' | 'b' | null = gameStatus === 'checkmate'
    ? (losingSide === 'w' ? 'b' : 'w')
    : null

  // Build headline + reason
  let headline: string
  let reasonRu: string
  let icon: string
  let resultClass: 'win' | 'loss' | 'draw'

  if (gameStatus === 'checkmate') {
    headline = winnerSide === 'w' ? 'Победили белые' : 'Победили чёрные'
    reasonRu = 'Мат — у проигравшего нет легальных ходов.'
    icon = '♔'
    // Determine win/loss relative to player
    if (gameMode === 'vs-ai') {
      resultClass = winnerSide === playerColor ? 'win' : 'loss'
    } else if (gameMode === 'multiplayer') {
      const myColor: 'w' | 'b' | null = mpRole === 'white' ? 'w' : mpRole === 'black' ? 'b' : null
      resultClass = myColor && winnerSide === myColor ? 'win' : myColor ? 'loss' : 'draw'
    } else {
      resultClass = 'win' // local 2-player — neutral
    }
  } else if (gameStatus === 'stalemate') {
    headline = 'Пат — ничья'
    reasonRu = 'У игрока нет легальных ходов, но король не под шахом.'
    icon = '⚖️'
    resultClass = 'draw'
  } else {
    headline = 'Ничья'
    reasonRu = 'По правилам: троекратное повторение / 50 ходов / недостаточно материала.'
    icon = '🤝'
    resultClass = 'draw'
  }

  // Personal verdict line for vs-AI / multiplayer
  let personalLine: string | null = null
  if (gameMode === 'vs-ai' && winnerSide) {
    if (resultClass === 'win') personalLine = `Вы обыграли Stockfish (уровень ${difficulty}/5). 🔥`
    else personalLine = `Stockfish (уровень ${difficulty}/5) победил. Не сдавайтесь — попробуйте ещё.`
  } else if (gameMode === 'multiplayer' && winnerSide) {
    const myColor: 'w' | 'b' | null = mpRole === 'white' ? 'w' : mpRole === 'black' ? 'b' : null
    if (myColor && winnerSide === myColor) personalLine = 'Вы победили в онлайн-партии. 👑'
    else if (myColor) personalLine = 'Соперник победил. Реванш?'
  }

  // Stats
  const movesPlayed = chess.history().length
  const fullMoves = Math.ceil(movesPlayed / 2)
  const durationMs = gameStartedAt && gameEndedAt
    ? gameEndedAt - gameStartedAt
    : 0
  const durationStr = durationMs > 0 ? formatDuration(durationMs) : '—'

  return (
    <div className="modal-overlay" onClick={closeGameOver}>
      <div className={`modal-card game-over-modal ${resultClass}`} onClick={e => e.stopPropagation()}>
        <div className="game-over-icon">{icon}</div>
        <div className="game-over-title">{headline}</div>
        <div className="game-over-reason">{reasonRu}</div>

        {personalLine && (
          <div className="game-over-personal">{personalLine}</div>
        )}

        <div className="game-over-stats">
          <div className="game-over-stat">
            <div className="game-over-stat-val">{fullMoves}</div>
            <div className="game-over-stat-label">ходов</div>
          </div>
          <div className="game-over-stat">
            <div className="game-over-stat-val">{movesPlayed}</div>
            <div className="game-over-stat-label">полуходов</div>
          </div>
          <div className="game-over-stat">
            <div className="game-over-stat-val">{durationStr}</div>
            <div className="game-over-stat-label">длительность</div>
          </div>
        </div>

        <div className="game-over-actions">
          <button
            className="btn-start-match"
            onClick={() => {
              if (movesPlayed === 0) {
                console.warn('[Coach] No moves to analyze in this game')
                return
              }
              closeGameOver()
              runCoachAnalysis()
            }}
            disabled={coachAnalyzing}
            style={{ marginBottom: 10, opacity: movesPlayed === 0 ? 0.55 : 1 }}
            title={movesPlayed === 0 ? 'В этой партии нет ходов для разбора' : 'Запустить анализ Stockfish'}
          >
            {coachAnalyzing
              ? '🧠 Анализирую…'
              : movesPlayed === 0
                ? '🧠 Нет ходов для разбора'
                : '🧠 Разобрать партию (AI-разбор)'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px 16px', fontSize: 13 }}
              onClick={() => { closeGameOver(); resetGame() }}
            >
              ↺ Реванш
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px 16px', fontSize: 13 }}
              onClick={() => { closeGameOver(); goToSetup() }}
            >
              + Новая игра
            </button>
          </div>
          <button
            className="modal-close-btn"
            onClick={closeGameOver}
            style={{ alignSelf: 'center', marginTop: 12 }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
