import { useGameStore } from '../../store/gameStore'

export function CoachReportModal() {
  const { coachReport, coachAnalyzing, coachProgress, closeCoachReport } = useGameStore()

  if (!coachReport && !coachAnalyzing) return null

  return (
    <div className="modal-overlay" onClick={() => !coachAnalyzing && closeCoachReport()}>
      <div className="modal-card coach-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">AI Coach Analysis</div>
        <div className="modal-subtitle">
          Stockfish reviewed every move — here's what stood out.
        </div>

        {coachAnalyzing && coachProgress && (
          <div className="coach-progress">
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Analyzing move {coachProgress.current} of {coachProgress.total}…
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Deep evaluation, this may take a moment.
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
                  {coachReport.whiteBlunders} blunder · {coachReport.whiteMistakes} mistake · {coachReport.whiteInaccuracies} inaccuracy
                </div>
              </div>
              <div className="coach-acc-card">
                <div className="coach-acc-side">Black</div>
                <div className="coach-acc-pct">{coachReport.blackAccuracy}%</div>
                <div className="coach-acc-stats">
                  {coachReport.blackBlunders} blunder · {coachReport.blackMistakes} mistake · {coachReport.blackInaccuracies} inaccuracy
                </div>
              </div>
            </div>

            <div className="coach-summary">
              {coachReport.summary}
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Critical moments
            </div>
            <div className="coach-blunders-list">
              {coachReport.moves
                .filter(m => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'inaccuracy')
                .slice(0, 12)
                .map((m, i) => (
                  <div key={i} className="coach-blunder-item">
                    <span className="coach-blunder-num">{m.moveNumber}{m.color === 'b' ? '…' : '.'}</span>
                    <span className="coach-blunder-san">{m.san}</span>
                    <span className={`coach-blunder-class ${m.classification}`}>{m.classification}</span>
                    <span className="coach-blunder-delta">{m.delta.toFixed(2)}</span>
                  </div>
                ))}
              {coachReport.moves.filter(m => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'inaccuracy').length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No notable mistakes — clean game.
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
