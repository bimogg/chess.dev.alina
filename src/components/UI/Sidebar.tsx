import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MoveHistory } from './MoveHistory'
import { CapturedPieces } from './CapturedPieces'

// ── Language ──────────────────────────────────────────────────────────
type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

// ── Icons ─────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconRotate = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </svg>
)
const IconUndo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
  </svg>
)
const IconSave = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)
const IconBulb = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)
const IconBrain = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

// ── Copy ─────────────────────────────────────────────────────────────
type T = Record<Lang, string>
const COPY: Record<string, T> = {
  home:          { en: 'Home',              ru: 'Главная'              },
  newGame:       { en: 'New',               ru: 'Новая'                },
  statusLive:    { en: 'In Progress',       ru: 'Игра идёт'            },
  statusCheck:   { en: 'Check',             ru: 'Шах'                  },
  statusMate:    { en: 'Checkmate',         ru: 'Мат'                  },
  statusStale:   { en: 'Stalemate',         ru: 'Пат'                  },
  statusDraw:    { en: 'Draw',              ru: 'Ничья'                },
  statusWait:    { en: 'Waiting for opponent', ru: 'Ожидание соперника' },
  thinking:      { en: 'Stockfish thinking…', ru: 'Stockfish думает…' },
  playWhite:     { en: 'Playing as White',  ru: 'Вы играете за белых'  },
  playBlack:     { en: 'Playing as Black',  ru: 'Вы играете за чёрных' },
  spectator:     { en: 'Spectating',        ru: 'Вы наблюдатель'       },
  opponent:      { en: 'Opponent',          ru: 'Соперник'             },
  waiting:       { en: 'Waiting…',          ru: 'Ожидаем…'             },
  whites:        { en: 'White',             ru: 'Белые'                },
  blacks:        { en: 'Black',             ru: 'Чёрные'               },
  yourTurn:      { en: 'Your turn',         ru: 'Ваш ход'              },
  theirTurn:     { en: 'Opponent\'s turn',  ru: 'Ход соперника'        },
  whiteTurn:     { en: 'White to move',     ru: 'Ход белых'            },
  blackTurn:     { en: 'Black to move',     ru: 'Ход чёрных'           },
  waitLink:      { en: 'Waiting for opponent to join via link.',
                   ru: 'Партия начнётся, когда друг присоединится.' },
  gameOver:      { en: 'Game over',         ru: 'Партия окончена'      },
  winBlack:      { en: 'Black wins by checkmate', ru: 'Победа чёрных — мат' },
  winWhite:      { en: 'White wins by checkmate', ru: 'Победа белых — мат' },
  spectNote:     { en: 'Moves available to players only.',
                   ru: 'Ходы доступны только игрокам.'              },
  inviteTitle:   { en: 'Invite Opponent',   ru: 'Пригласить соперника' },
  inviteDesc:    { en: 'Share the link to start the match.',
                   ru: 'Отправьте ссылку другу, чтобы начать матч.' },
  copyLink:      { en: 'Copy link',         ru: 'Скопировать ссылку'   },
  copied:        { en: 'Copied',            ru: 'Скопировано'          },
  reset:         { en: 'Restart',           ru: 'Заново'               },
  undo:          { en: 'Undo',              ru: 'Отмена'               },
  save:          { en: 'Save game',         ru: 'Сохранить'            },
  helpTitle:     { en: 'Assistance',        ru: 'Помощь'               },
  hint:          { en: 'AI Hint',           ru: 'Подсказка ИИ'         },
  hideHint:      { en: 'Hide hint',         ru: 'Скрыть'               },
  hintLabel:     { en: 'on board',          ru: 'на доске'             },
  analyze:       { en: 'Analyze game',      ru: 'Разобрать партию'     },
  analyzing:     { en: 'Analyzing…',        ru: 'Анализирую…'          },
  movesTitle:    { en: 'Moves',             ru: 'Ходы'                 },
  noMoves:       { en: 'No moves yet.',     ru: 'Ходов пока нет.'      },
  captureTitle:  { en: 'Captured',          ru: 'Захваченные'          },
}

export function Sidebar() {
  const {
    chess, gameMode, playerColor, gameStatus, aiThinking,
    goToLanding, goToSetup, resetGame,
    saveCurrentGame, undoMove,
    requestHint, clearHint, hintSquare, hintToSquare,
    runCoachAnalysis, coachAnalyzing,
    leaveMultiplayer, mpRole, mpRoomLink, mpAwaitingHostStart,
    mpWhiteName, mpBlackName,
    profile,
  } = useGameStore()

  const [copied, setCopied] = useState(false)
  const lang = getLang()
  const t = (key: string) => COPY[key]?.[lang] ?? key

  const turn     = chess.turn() as 'w' | 'b'
  const history  = chess.history()
  const isOver   = gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw'
  const hasMoves = history.length > 0

  // My color
  const myColor: 'w' | 'b' | null =
    gameMode === 'multiplayer'
      ? mpRole === 'white' ? 'w' : mpRole === 'black' ? 'b' : null
      : gameMode === 'vs-ai' ? playerColor : null

  const isSpectator       = gameMode === 'multiplayer' && mpRole === 'spectator'
  const isMyTurn          = myColor !== null && turn === myColor && !isOver
  const isWaiting         = gameMode === 'multiplayer' && mpAwaitingHostStart && mpRole === 'white'

  // Status
  type StatusKind = 'live' | 'check' | 'over' | 'waiting'
  let statusText = t('statusLive')
  let statusKind: StatusKind = 'live'
  if (isWaiting)                    { statusText = t('statusWait'); statusKind = 'waiting' }
  else if (gameStatus === 'checkmate') { statusText = t('statusMate'); statusKind = 'over' }
  else if (gameStatus === 'stalemate') { statusText = t('statusStale'); statusKind = 'over' }
  else if (gameStatus === 'draw')   { statusText = t('statusDraw');  statusKind = 'over' }
  else if (gameStatus === 'check')  { statusText = t('statusCheck'); statusKind = 'check' }

  // Turn line
  let turnLine: string
  if (isWaiting)    turnLine = t('waitLink')
  else if (isOver)  turnLine = gameStatus === 'checkmate'
                                ? (turn === 'w' ? t('winBlack') : t('winWhite'))
                                : t('gameOver')
  else if (gameMode === 'local' || isSpectator) turnLine = turn === 'w' ? t('whiteTurn') : t('blackTurn')
  else if (isMyTurn) turnLine = t('yourTurn')
  else               turnLine = t('theirTurn')

  // Opponent
  const opponentName = gameMode === 'multiplayer'
    ? mpRole === 'white' ? (mpBlackName ?? t('waiting'))
    : mpRole === 'black' ? (mpWhiteName ?? t('waiting'))
    : null
    : null

  // Player initial for avatar
  const initial = profile?.username ? profile.username[0].toUpperCase() : '?'
  const username = profile?.username ?? '—'
  const city     = profile?.city ?? null

  // Visibility flags
  const showInvite   = gameMode === 'multiplayer' && !!mpRoomLink
  const showAiHint   = gameMode === 'vs-ai'
  const showAiCoach  = gameMode !== 'multiplayer'
  const showAiCard   = showAiHint || showAiCoach
  const showUndo     = gameMode !== 'multiplayer' && hasMoves

  const handleCopy = async () => {
    if (!mpRoomLink) return
    try { await navigator.clipboard?.writeText(mpRoomLink) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <aside className="sidebar sidebar-v2">

      {/* ── Top bar ── */}
      <div className="sidebar-topbar">
        <button className="sidebar-home-btn" onClick={() => { leaveMultiplayer(); goToLanding() }}>
          <IconHome />
        </button>
        <div className="sidebar-logo">ChessVerse</div>
        <button className="sidebar-new-btn" onClick={goToSetup}>
          <IconPlus /> {t('newGame')}
        </button>
      </div>

      {/* ── Player identity ── */}
      <div className="sidebar-section">
        <div className="player-identity">
          <div className="player-avatar">{initial}</div>
          <div className="player-info">
            <div className="player-name">{username}</div>
            {city && (
              <div className="player-city"><IconMapPin />{city}</div>
            )}
            {myColor && !isSpectator && (
              <div className={`player-role player-role--${myColor}`}>
                <span className={`player-role-dot player-role-dot--${myColor}`} />
                {myColor === 'w' ? t('playWhite') : t('playBlack')}
              </div>
            )}
            {isSpectator && (
              <div className="player-role player-role--spec">{t('spectator')}</div>
            )}
          </div>
        </div>

        {/* Opponent row (multiplayer only) */}
        {opponentName !== null && (
          <div className="opponent-row">
            <span className="opponent-label">{t('opponent')}</span>
            <span className="opponent-name">{opponentName}</span>
          </div>
        )}
      </div>

      {/* ── Status / turn card ── */}
      <div className="sidebar-section">
        <div className={`status-hero status-hero--${statusKind}`}>
          <div className="status-hero-row">
            <div className={`status-hero-dot status-hero-dot--${statusKind}`} />
            <div className="status-hero-title">{statusText}</div>
            {aiThinking && <span className="status-hero-thinking">{t('thinking')}</span>}
          </div>

          <div className={`status-hero-turn ${isMyTurn ? 'status-hero-turn--mine' : ''}`}>
            <span className={`status-hero-turn-color status-hero-turn-color--${turn}`} />
            <span>{turnLine}</span>
          </div>

          {isSpectator && (
            <div className="status-hero-note">{t('spectNote')}</div>
          )}
        </div>
      </div>

      {/* ── Invite friend ── */}
      {showInvite && (
        <div className="sidebar-section">
          <div className="invite-card">
            <div className="invite-card-header">
              <div className="invite-card-title">{t('inviteTitle')}</div>
            </div>
            <div className="invite-card-desc">{t('inviteDesc')}</div>
            <button className="invite-card-btn" onClick={handleCopy}>
              {copied
                ? <><IconCheck />{t('copied')}</>
                : <><IconLink />{t('copyLink')}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="sidebar-section">
        <div className="controls-row">
          <button className="sb-btn sb-btn-ghost sb-btn-icon" onClick={resetGame} title={t('reset')}>
            <IconRotate />{t('reset')}
          </button>
          {showUndo && (
            <button className="sb-btn sb-btn-ghost sb-btn-icon" onClick={undoMove} title={t('undo')}>
              <IconUndo />{t('undo')}
            </button>
          )}
        </div>
        {hasMoves && (
          <button className="sb-btn sb-btn-ghost sb-btn-icon sb-btn-full" onClick={saveCurrentGame}>
            <IconSave />{t('save')}
          </button>
        )}
      </div>

      {/* ── AI assistance ── */}
      {showAiCard && (
        <div className="sidebar-section">
          <div className="section-title">{t('helpTitle')}</div>
          {showAiHint && (
            <>
              <button
                className="sb-btn sb-btn-ghost sb-btn-icon sb-btn-full"
                style={{ marginBottom: 8 }}
                onClick={hintSquare ? clearHint : requestHint}
                disabled={isOver}
              >
                <IconBulb />
                {hintSquare ? t('hideHint') : t('hint')}
              </button>
              {hintSquare && hintToSquare && (
                <div className="hint-result">
                  <span className="hint-from">{hintSquare.toUpperCase()}</span>
                  <span className="hint-arrow">→</span>
                  <span className="hint-to">{hintToSquare.toUpperCase()}</span>
                  <span className="hint-label">{t('hintLabel')}</span>
                </div>
              )}
            </>
          )}
          {showAiCoach && (
            <button
              className="sb-btn sb-btn-ghost sb-btn-icon sb-btn-full"
              onClick={runCoachAnalysis}
              disabled={coachAnalyzing}
              style={{ opacity: hasMoves ? 1 : 0.5 }}
            >
              <IconBrain />
              {coachAnalyzing ? t('analyzing') : t('analyze')}
            </button>
          )}
        </div>
      )}

      {/* ── Move history ── */}
      <div className="sidebar-section">
        <div className="section-title">{t('movesTitle')}</div>
        {hasMoves
          ? <MoveHistory />
          : <div className="empty-line">{t('noMoves')}</div>
        }
      </div>

      {/* ── Captured pieces ── */}
      <div className="sidebar-section">
        <div className="section-title">{t('captureTitle')}</div>
        <CapturedPieces />
      </div>

    </aside>
  )
}
