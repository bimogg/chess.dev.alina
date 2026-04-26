import { useGameStore } from '../../store/gameStore'

export function ProUpgradeModal() {
  const { showProUpgrade, closeProUpgrade, buyPro, isPro } = useGameStore()

  if (!showProUpgrade) return null

  return (
    <div className="modal-overlay" onClick={closeProUpgrade}>
      <div className="modal-card pro-modal" onClick={e => e.stopPropagation()}>
        <div className="pro-modal-hero">
          <div className="pro-modal-crown">♛</div>
          <div className="pro-modal-title">ChessVerse Pro</div>
          <div className="pro-modal-tag">Unlock the full immersive experience</div>
        </div>

        <div className="pro-tier-grid">
          <div className="pro-tier">
            <div className="pro-tier-name">Free</div>
            <div className="pro-tier-price">$0</div>
            <div className="pro-tier-period">forever</div>
            <ul className="pro-tier-features">
              <li>3D board with classic pieces</li>
              <li>Stockfish AI (5 levels)</li>
              <li>Local 2-player + online P2P</li>
              <li>AI Coach analysis</li>
              <li>Local game history</li>
            </ul>
            <button
              className="pro-tier-btn"
              disabled
              style={{ cursor: 'default', opacity: 0.6 }}
            >
              Current plan
            </button>
          </div>

          <div className="pro-tier featured">
            <div className="pro-tier-badge">RECOMMENDED</div>
            <div className="pro-tier-name">Pro</div>
            <div className="pro-tier-price">$4.99</div>
            <div className="pro-tier-period">per month</div>
            <ul className="pro-tier-features">
              <li>Everything in Free</li>
              <li><strong>3 premium piece skins</strong></li>
              <li>Gold, Marble & Neon materials</li>
              <li>Priority Stockfish (depth 18)</li>
              <li>Cloud sync across devices</li>
              <li>Pro badge on leaderboard</li>
            </ul>
            <button
              className="pro-tier-btn"
              onClick={buyPro}
              disabled={isPro}
            >
              {isPro ? '✓ Pro Active' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        <div className="pro-modal-disclaimer">
          Demo: payment is simulated locally. In production, Stripe integration would handle billing.
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="modal-close-btn" onClick={closeProUpgrade}>Maybe later</button>
        </div>
      </div>
    </div>
  )
}
