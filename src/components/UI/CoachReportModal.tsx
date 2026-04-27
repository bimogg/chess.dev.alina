import { useGameStore } from '../../store/gameStore'

export function CoachReportModal() {
  const { coachReport, coachAnalyzing, coachProgress, closeCoachReport } = useGameStore()

  if (!coachReport && !coachAnalyzing) return null

  return (
    <div className="modal-overlay" onClick={() => !coachAnalyzing && closeCoachReport()}>
      <div className="modal-card coach-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">AI Coach Analysis</div>
        <div className="modal-subtitle">
          Stockfish reviewed every move — here's the verdict, with the moves you should have played instead.
        </div>

        {coachAnalyzing && coachProgress && (
          <div className="coach-progress">
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Analyzing move {coachProgress.current} of {coachProgress.total}…
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Deep search at depth 14 — this is not instant.
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
                <div className="coach-acc-side">White</div>
                <div className="coach-acc-pct">{coachReport.whiteAccuracy}%</div>
                <div className="coach-acc-stats">
                  ACPL {coachReport.whiteAcpl} · {coachReport.whiteBlunders}B · {coachReport.whiteMistakes}M · {coachReport.whiteInaccuracies}I
                </div>
              </div>
              <div className="coach-acc-card">
                <div className="coach-acc-side">Black</div>
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
                <div className="coach-decisive-label">⚖️ Decisive moment</div>
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
                      → should be <strong>{coachReport.decisiveMoment.bestMoveSan}</strong>
                    </span>
                  )}
                </div>
                {coachReport.decisiveMoment.comment && (
                  <div className="coach-decisive-comment">{coachReport.decisiveMoment.comment}</div>
                )}
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
              All notable moves
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
                        <span className="coach-blunder-alt">best: <strong>{m.bestMoveSan}</strong></span>
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
                  No notable mistakes from either side. Clean game.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <button className="modal-close-btn" onClick={closeCoachReport}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
