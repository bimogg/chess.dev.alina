import { useGameStore } from '../../store/gameStore'

type Lang = 'en' | 'ru'
function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const s = window.localStorage.getItem('cv_lang')
  if (s === 'ru' || s === 'en') return s
  const a = document.documentElement.getAttribute('data-ui-lang')
  return a === 'ru' ? 'ru' : 'en'
}

export function CoachReportModal() {
  const { coachReport, coachAnalyzing, coachProgress, closeCoachReport } = useGameStore()
  const lang = getLang()

  if (!coachReport && !coachAnalyzing) return null

  return (
    <div className="modal-overlay" onClick={() => !coachAnalyzing && closeCoachReport()}>
      <div className="modal-card coach-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{lang === 'ru' ? 'AI-разбор партии' : 'AI Game Report'}</div>
        <div className="modal-subtitle">
          {lang === 'ru'
            ? 'Stockfish проверил каждый ход — ниже вердикт и лучшие продолжения.'
            : 'Stockfish reviewed every move — verdict and best continuations below.'}
        </div>

        {coachAnalyzing && coachProgress && (
          <div className="coach-progress">
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {lang === 'ru'
                ? `Анализ хода ${coachProgress.current} из ${coachProgress.total}…`
                : `Analyzing move ${coachProgress.current} of ${coachProgress.total}…`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {lang === 'ru'
                ? 'Глубокий поиск до 14 глубины — это занимает время.'
                : 'Deep search up to depth 14 — this may take a moment.'}
            </div>
            <div className="coach-progress-bar">
              <div
                className="coach-progress-bar-fill"
                style={{ width: `${(coachProgress.current / coachProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {coachReport && (
          <>
            <div className="coach-acc-grid">
              <div className="coach-acc-card">
                <div className="coach-acc-side">{lang === 'ru' ? 'Белые' : 'White'}</div>
                <div className="coach-acc-pct">{coachReport.whiteAccuracy}%</div>
                <div className="coach-acc-stats">
                  ACPL {coachReport.whiteAcpl} · {coachReport.whiteBlunders}B · {coachReport.whiteMistakes}M · {coachReport.whiteInaccuracies}I
                </div>
              </div>
              <div className="coach-acc-card">
                <div className="coach-acc-side">{lang === 'ru' ? 'Чёрные' : 'Black'}</div>
                <div className="coach-acc-pct">{coachReport.blackAccuracy}%</div>
                <div className="coach-acc-stats">
                  ACPL {coachReport.blackAcpl} · {coachReport.blackBlunders}B · {coachReport.blackMistakes}M · {coachReport.blackInaccuracies}I
                </div>
              </div>
            </div>

            <div className="coach-summary">
              {coachReport.verdict}
            </div>

            {coachReport.decisiveMoment && (
              <div className="coach-decisive">
                <div className="coach-decisive-label">⚖️ {lang === 'ru' ? 'Решающий момент' : 'Decisive Moment'}</div>
                <div className="coach-decisive-row">
                  <span className="coach-decisive-num">
                    {coachReport.decisiveMoment.moveNumber}{coachReport.decisiveMoment.color === 'b' ? '…' : '.'}
                  </span>
                  <span className="coach-blunder-san">{coachReport.decisiveMoment.san}</span>
                  <span className={`coach-blunder-class ${coachReport.decisiveMoment.classification}`}>
                    {coachReport.decisiveMoment.classification}
                  </span>
                  {coachReport.decisiveMoment.bestMoveSan && (
                    <span className="coach-decisive-alt">
                      {lang === 'ru' ? '→ лучше: ' : '→ better: '}<strong>{coachReport.decisiveMoment.bestMoveSan}</strong>
                    </span>
                  )}
                </div>
                {coachReport.decisiveMoment.comment && (
                  <div className="coach-decisive-comment">{coachReport.decisiveMoment.comment}</div>
                )}
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
              {lang === 'ru' ? 'Ключевые ошибки' : 'Key mistakes'}
            </div>
            <div className="coach-blunders-list">
              {coachReport.moves
                .filter(m => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'inaccuracy')
                .slice(0, 20)
                .map((m, i) => (
                  <div key={i} className="coach-blunder-item">
                    <div className="coach-blunder-row-top">
                      <span className="coach-blunder-num">{m.moveNumber}{m.color === 'b' ? '…' : '.'}</span>
                      <span className="coach-blunder-san">{m.san}</span>
                      <span className={`coach-blunder-class ${m.classification}`}>{m.classification}</span>
                      {m.bestMoveSan && m.bestMoveSan !== m.san && (
                        <span className="coach-blunder-alt">{lang === 'ru' ? 'лучше: ' : 'better: '}<strong>{m.bestMoveSan}</strong></span>
                      )}
                      <span className="coach-blunder-delta">−{Math.round(m.cpLoss)} cp</span>
                    </div>
                    {m.comment && (
                      <div className="coach-blunder-comment">{m.comment}</div>
                    )}
                  </div>
                ))}
              {coachReport.moves.filter(m => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'inaccuracy').length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  {lang === 'ru' ? 'Заметных ошибок не найдено. Чистая партия.' : 'No major mistakes found. Clean game.'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <button className="modal-close-btn" onClick={closeCoachReport}>{lang === 'ru' ? 'Закрыть' : 'Close'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
