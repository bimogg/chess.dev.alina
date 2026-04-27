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
          <div className="pro-modal-tag">Расширенные визуальные возможности</div>
        </div>

        <div className="pro-tier-grid">
          <div className="pro-tier">
            <div className="pro-tier-name">Бесплатно</div>
            <div className="pro-tier-price">$0</div>
            <div className="pro-tier-period">навсегда</div>
            <ul className="pro-tier-features">
              <li>3D-доска и классические фигуры</li>
              <li>Stockfish (5 уровней)</li>
              <li>Локальная игра и онлайн по ссылке</li>
              <li>AI-разбор партии</li>
              <li>Локальная история партий</li>
            </ul>
            <button
              className="pro-tier-btn"
              disabled
              style={{ cursor: 'default', opacity: 0.6 }}
            >
              Текущий план
            </button>
          </div>

          <div className="pro-tier featured">
            <div className="pro-tier-badge">РЕКОМЕНДУЕМ</div>
            <div className="pro-tier-name">Pro</div>
            <div className="pro-tier-price">$4.99</div>
            <div className="pro-tier-period">в месяц</div>
            <ul className="pro-tier-features">
              <li>Всё из бесплатного плана</li>
              <li><strong>3 премиум-скина фигур</strong></li>
              <li>Материалы Gold, Marble и Neon</li>
              <li>Приоритетный анализ Stockfish</li>
              <li>Бейдж Pro в лидерборде</li>
            </ul>
            <button
              className="pro-tier-btn"
              onClick={buyPro}
              disabled={isPro}
            >
              {isPro ? '✓ Pro активен' : 'Перейти на Pro'}
            </button>
          </div>
        </div>

        <div className="pro-modal-disclaimer">
          Деморежим: оплата не подключена. Реальный платёжный сценарий — в roadmap.
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="modal-close-btn" onClick={closeProUpgrade}>Позже</button>
        </div>
      </div>
    </div>
  )
}
