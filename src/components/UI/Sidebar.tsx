import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MoveHistory } from './MoveHistory'
import { CapturedPieces } from './CapturedPieces'

export function Sidebar() {
  const {
    chess, gameMode, playerColor, gameStatus, aiThinking,
    goToLanding, goToSetup, resetGame,
    saveCurrentGame, undoMove,
    requestHint, clearHint, hintSquare, hintToSquare,
    runCoachAnalysis, coachAnalyzing,
    leaveMultiplayer, mpRole, mpRoomLink, mpAwaitingHostStart, mpWhiteName, mpBlackName,
  } = useGameStore()

  const [copied, setCopied] = useState(false)

  const turn = chess.turn() as 'w' | 'b'
  const history = chess.history()
  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw'
  const hasMoves = history.length > 0

  // ─── Derive my color across all game modes ─────────────────────────────
  // local mode: there's no "me" — both sides played on same screen
  // vs-ai: my color = playerColor
  // multiplayer: my color from mpRole
  const myColor: 'w' | 'b' | null =
    gameMode === 'multiplayer'
      ? mpRole === 'white' ? 'w'
        : mpRole === 'black' ? 'b'
          : null
      : gameMode === 'vs-ai'
        ? playerColor
        : null
  const isSpectator = gameMode === 'multiplayer' && mpRole === 'spectator'
  const isMyTurn = myColor !== null && turn === myColor && !isGameOver
  const isWaitingForOpponentJoin =
    gameMode === 'multiplayer' && mpAwaitingHostStart && mpRole === 'white'

  // ─── Game status text (top label) ──────────────────────────────────────
  let gameStatusText = 'Игра идёт'
  let gameStatusKind: 'live' | 'check' | 'over' | 'waiting' = 'live'
  if (isWaitingForOpponentJoin) {
    gameStatusText = 'Ожидание соперника'
    gameStatusKind = 'waiting'
  } else if (gameStatus === 'checkmate') {
    gameStatusText = 'Мат'
    gameStatusKind = 'over'
  } else if (gameStatus === 'stalemate') {
    gameStatusText = 'Пат'
    gameStatusKind = 'over'
  } else if (gameStatus === 'draw') {
    gameStatusText = 'Ничья'
    gameStatusKind = 'over'
  } else if (gameStatus === 'check') {
    gameStatusText = 'Шах'
    gameStatusKind = 'check'
  }

  // ─── Player-side line ──────────────────────────────────────────────────
  let sideLine: string | null = null
  if (isSpectator) sideLine = 'Вы наблюдатель'
  else if (myColor === 'w') sideLine = 'Вы играете за белых ♔'
  else if (myColor === 'b') sideLine = 'Вы играете за чёрных ♚'
  let opponentLine: string | null = null
  if (gameMode === 'multiplayer') {
    if (mpRole === 'white') opponentLine = `Соперник: ${mpBlackName ?? 'ожидаем...'}`
    else if (mpRole === 'black') opponentLine = `Соперник: ${mpWhiteName ?? 'ожидаем...'}`
    else opponentLine = `Белые: ${mpWhiteName ?? 'Игрок'} · Чёрные: ${mpBlackName ?? 'ожидаем...'}`
  }

  // local mode: no side line — both players use the same screen

  // ─── Turn line ─────────────────────────────────────────────────────────
  let turnLine: string
  if (isWaitingForOpponentJoin) {
    turnLine = 'Партия начнётся, когда друг присоединится по ссылке.'
  } else if (isGameOver) {
    turnLine =
      gameStatus === 'checkmate'
        ? `Победа ${turn === 'w' ? 'чёрных' : 'белых'} — мат`
        : 'Партия окончена'
  } else if (gameMode === 'local') {
    turnLine = turn === 'w' ? 'Ход белых' : 'Ход чёрных'
  } else if (isSpectator) {
    turnLine = turn === 'w' ? 'Ход белых' : 'Ход чёрных'
  } else if (isMyTurn) {
    turnLine = 'Ваш ход'
  } else {
    turnLine = 'Сейчас ход соперника. Дождитесь ответа.'
  }

  // ─── Invite ────────────────────────────────────────────────────────────
  const showInvite = gameMode === 'multiplayer' && !!mpRoomLink

  const handleCopy = async () => {
    if (!mpRoomLink) return
    try { await navigator.clipboard?.writeText(mpRoomLink) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // ─── AI buttons visibility ─────────────────────────────────────────────
  // multiplayer = hide entirely (no cheating help)
  // vs-ai = hint + coach
  // local = coach only
  const showAiHint = gameMode === 'vs-ai'
  const showAiCoach = gameMode !== 'multiplayer'
  const showAiCard = showAiHint || showAiCoach

  // ─── Controls visibility ───────────────────────────────────────────────
  const showUndo = gameMode !== 'multiplayer' && hasMoves
  const showSave = hasMoves

  return (
    <aside className="sidebar sidebar-v2">
      {/* Top nav */}
      <div className="sidebar-topbar">
        <button className="sidebar-home-btn" onClick={() => { leaveMultiplayer(); goToLanding() }}>
          ← На главную
        </button>
        <div className="sidebar-logo">♟ ChessVerse</div>
        <button className="sidebar-new-btn" onClick={goToSetup}>
          Новая
        </button>
      </div>

      {/* ── 1. STATUS CARD — most prominent ── */}
      <div className="sidebar-section">
        <div className={`status-hero status-hero--${gameStatusKind}`}>
          <div className="status-hero-row">
            <div className={`status-hero-dot status-hero-dot--${gameStatusKind}`} />
            <div className="status-hero-title">{gameStatusText}</div>
            {aiThinking && <span className="status-hero-thinking">Stockfish думает…</span>}
          </div>

          {sideLine && (
            <div className="status-hero-side">{sideLine}</div>
          )}
          {opponentLine && (
            <div className="status-hero-side">{opponentLine}</div>
          )}

          <div className={`status-hero-turn ${isMyTurn ? 'status-hero-turn--mine' : ''}`}>
            <span className={`status-hero-turn-color status-hero-turn-color--${turn}`} />
            <span>{turnLine}</span>
          </div>

          {isSpectator && (
            <div className="status-hero-note">
              Ходы доступны только игрокам.
            </div>
          )}
        </div>
      </div>

      {/* ── 2. INVITE FRIEND — multiplayer host only ── */}
      {showInvite && (
        <div className="sidebar-section">
          <div className="invite-card">
            <div className="invite-card-title">Пригласить друга</div>
            <div className="invite-card-desc">Отправьте ссылку второму игроку.</div>
            <button className="invite-card-btn" onClick={handleCopy}>
              {copied ? '✓ Скопировано' : 'Скопировать ссылку'}
            </button>
            {copied && <div className="invite-card-status">Ссылка скопирована</div>}
          </div>
        </div>
      )}

      {/* ── 3. CONTROLS — only useful buttons ── */}
      <div className="sidebar-section">
        <div className="controls-row">
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={resetGame}>
            ↺ Заново
          </button>
          {showUndo && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={undoMove}
            >
              ↩ Отменить
            </button>
          )}
        </div>
        {showSave && (
          <div className="controls-row">
            <button className="btn btn-primary btn-sm btn-full" onClick={saveCurrentGame}>
              💾 Сохранить партию
            </button>
          </div>
        )}
      </div>

      {/* ── 4. AI CARD — only in vs-AI / local ── */}
      {showAiCard && (
        <div className="sidebar-section">
          <div className="section-title">Помощь</div>
          {showAiHint && (
            <>
              <button
                className="btn btn-secondary btn-sm btn-full"
                onClick={hintSquare ? clearHint : requestHint}
                disabled={isGameOver}
                style={{ marginBottom: 8 }}
              >
                {hintSquare ? '✕ Скрыть подсказку' : '💡 Подсказка ИИ'}
              </button>
              {hintSquare && hintToSquare && (
                <div className="hint-result">
                  <span className="hint-from">{hintSquare.toUpperCase()}</span>
                  <span className="hint-arrow">→</span>
                  <span className="hint-to">{hintToSquare.toUpperCase()}</span>
                  <span className="hint-label">на доске</span>
                </div>
              )}
            </>
          )}
          {showAiCoach && (
            <button
              className="btn btn-primary btn-sm btn-full"
              onClick={runCoachAnalysis}
              disabled={coachAnalyzing}
              style={{ opacity: hasMoves ? 1 : 0.7 }}
              title={hasMoves ? 'Stockfish разберёт партию' : 'Партия пока пуста'}
            >
              {coachAnalyzing ? '🧠 Анализирую…' : '🧠 Разобрать партию'}
            </button>
          )}
        </div>
      )}

      {/* ── 5. MOVE HISTORY ── */}
      <div className="sidebar-section">
        <div className="section-title">Ходы</div>
        {hasMoves
          ? <MoveHistory />
          : <div className="empty-line">Пока ходов нет.</div>
        }
      </div>

      {/* ── 6. CAPTURED PIECES ── */}
      <div className="sidebar-section">
        <div className="section-title">Взятые фигуры</div>
        <CapturedPieces />
      </div>
    </aside>
  )
}
