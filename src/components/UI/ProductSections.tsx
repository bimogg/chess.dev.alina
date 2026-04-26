const LEADERBOARD = [
  { city: 'Astana', players: 1240, rating: 2180 },
  { city: 'Almaty', players: 980, rating: 2145 },
  { city: 'Shymkent', players: 620, rating: 2090 },
]

export function ProductSections() {
  return (
    <>
      <div className="sidebar-section">
        <div className="section-title">City Leaderboard</div>
        {LEADERBOARD.map((row, i) => (
          <div key={row.city} className="leaderboard-row">
            <span className="leaderboard-rank">#{i + 1}</span>
            <span className="leaderboard-city">{row.city}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '8px' }}>{row.players} players</span>
            <span className="leaderboard-score">&#11088; {row.rating}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="section-title">Coming Soon</div>

        <div className="product-card">
          <div className="product-title">
            AI Coach
            <span className="badge-coming-soon">SOON</span>
          </div>
          <div className="product-desc">Deep position analysis, opening suggestions, and personalized training plans powered by advanced chess AI.</div>
        </div>

        <div className="product-card">
          <div className="product-title">
            Multiplayer by Link
            <span className="badge-coming-soon">SOON</span>
          </div>
          <div className="product-desc">Challenge friends anywhere — share a link, play instantly. No account required.</div>
        </div>

        <div className="product-card">
          <div className="product-title">
            Upgrade to Pro
            <span className="badge-pro">PRO</span>
          </div>
          <div className="product-desc">Custom piece skins, advanced analysis tools, unlimited cloud save history, and priority matchmaking.</div>
        </div>
      </div>
    </>
  )
}
