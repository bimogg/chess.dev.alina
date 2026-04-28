import { useGameStore } from '../../store/gameStore'

type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

function formatDuration(ms: number, lang: Lang): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (lang === 'ru') {
    if (h > 0) return `${h} ч ${m} мин ${s} сек`
    if (m > 0) return `${m} мин ${s} сек`
    return `${s} сек`
  }
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function GameOverModal() {
  const {
    showGameOver, closeGameOver,
    gameStatus, chess, gameStartedAt, gameEndedAt,
    gameMode, playerColor, difficulty, mpRole,
    runCoachAnalysis, coachAnalyzing, resetGame, goToSetup,
  } = useGameStore()

  if (!showGameOver) return null
  const lang = getLang()

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
    headline = winnerSide === 'w'
      ? (lang === 'ru' ? 'Победили белые' : 'White wins')
      : (lang === 'ru' ? 'Победили чёрные' : 'Black wins')
    reasonRu = lang === 'ru'
      ? 'Мат — у проигравшего нет легальных ходов.'
      : 'Checkmate — the losing side has no legal moves.'
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
    headline = lang === 'ru' ? 'Пат — ничья' : 'Stalemate — draw'
    reasonRu = lang === 'ru'
      ? 'У игрока нет легальных ходов, но король не под шахом.'
      : 'No legal moves for the side to move, but the king is not in check.'
    icon = '⚖️'
    resultClass = 'draw'
  } else {
    headline = lang === 'ru' ? 'Ничья' : 'Draw'
    reasonRu = lang === 'ru'
      ? 'По правилам: троекратное повторение / 50 ходов / недостаточно материала.'
      : 'Draw by rule: repetition / 50-move rule / insufficient material.'
    icon = '🤝'
    resultClass = 'draw'
  }

  // Personal verdict line for vs-AI / multiplayer
  let personalLine: string | null = null
  if (gameMode === 'vs-ai' && winnerSide) {
    if (resultClass === 'win') {
      personalLine = lang === 'ru'
        ? `Вы обыграли Stockfish (уровень ${difficulty}/5). 🔥`
        : `You beat Stockfish (level ${difficulty}/5). 🔥`
    } else {
      personalLine = lang === 'ru'
        ? `Stockfish (уровень ${difficulty}/5) победил. Не сдавайтесь — попробуйте ещё.`
        : `Stockfish (level ${difficulty}/5) won. Keep going and try again.`
    }
  } else if (gameMode === 'multiplayer' && winnerSide) {
    const myColor: 'w' | 'b' | null = mpRole === 'white' ? 'w' : mpRole === 'black' ? 'b' : null
    if (myColor && winnerSide === myColor) personalLine = lang === 'ru' ? 'Вы победили в онлайн-партии. 👑' : 'You won the online game. 👑'
    else if (myColor) personalLine = lang === 'ru' ? 'Соперник победил. Реванш?' : 'Opponent won. Rematch?'
  }

  // Stats
  const movesPlayed = chess.history().length
  const fullMoves = Math.ceil(movesPlayed / 2)
  const durationMs = gameStartedAt && gameEndedAt
    ? gameEndedAt - gameStartedAt
    : 0
  const durationStr = durationMs > 0 ? formatDuration(durationMs, lang) : '—'

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
            <div className="game-over-stat-label">{lang === 'ru' ? 'ходов' : 'moves'}</div>
          </div>
          <div className="game-over-stat">
            <div className="game-over-stat-val">{movesPlayed}</div>
            <div className="game-over-stat-label">{lang === 'ru' ? 'полуходов' : 'ply'}</div>
          </div>
          <div className="game-over-stat">
            <div className="game-over-stat-val">{durationStr}</div>
            <div className="game-over-stat-label">{lang === 'ru' ? 'длительность' : 'duration'}</div>
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
            title={
              movesPlayed === 0
                ? (lang === 'ru' ? 'В этой партии нет ходов для разбора' : 'No moves to analyze in this game')
                : (lang === 'ru' ? 'Запустить анализ Stockfish' : 'Run Stockfish analysis')
            }
          >
            {coachAnalyzing
              ? (lang === 'ru' ? '🧠 Анализирую…' : '🧠 Analyzing…')
              : movesPlayed === 0
                ? (lang === 'ru' ? '🧠 Нет ходов для разбора' : '🧠 No moves to analyze')
                : (lang === 'ru' ? '🧠 Разобрать партию (AI-разбор)' : '🧠 Analyze game (AI report)')}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px 16px', fontSize: 13 }}
              onClick={() => { closeGameOver(); resetGame() }}
            >
              {lang === 'ru' ? '↺ Реванш' : '↺ Rematch'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px 16px', fontSize: 13 }}
              onClick={() => { closeGameOver(); goToSetup() }}
            >
              {lang === 'ru' ? '+ Новая игра' : '+ New game'}
            </button>
          </div>
          <button
            className="modal-close-btn"
            onClick={closeGameOver}
            style={{ alignSelf: 'center', marginTop: 12 }}
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
