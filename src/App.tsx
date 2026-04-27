import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { LandingPage } from './components/Landing/LandingPage'
import { SetupScreen } from './components/Setup/SetupScreen'
import { ChessScene } from './components/Scene/ChessScene'
import { Sidebar } from './components/UI/Sidebar'
import { PromotionModal } from './components/UI/PromotionModal'
import { ProUpgradeModal } from './components/UI/ProUpgradeModal'
import { SkinsShopModal } from './components/UI/SkinsShopModal'
import { AuthModal } from './components/UI/AuthModal'
import { CoachReportModal } from './components/UI/CoachReportModal'
import { GameOverModal } from './components/UI/GameOverModal'
import { MultiplayerLobby } from './components/Multiplayer/MultiplayerLobby'
import { ProfileScreen } from './components/Profile/ProfileScreen'
import { LeaderboardScreen } from './components/Profile/LeaderboardScreen'
import { getRoomFromUrl } from './utils/multiplayer'

export default function App() {
  const {
    screen, promotionPending, goToMultiplayerLobby,
    gameStatus, gameEndedAt, markGameEnd,
  } = useGameStore()

  // If URL has ?room=... auto-redirect to multiplayer lobby
  useEffect(() => {
    const room = getRoomFromUrl()
    if (room && screen === 'landing') {
      goToMultiplayerLobby()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detect game end → fire end-of-game modal once.
  // Idempotent inside markGameEnd: only sets gameEndedAt + showGameOver if not already set.
  useEffect(() => {
    const isOver = gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw'
    if (isOver && !gameEndedAt) {
      markGameEnd()
    }
  }, [gameStatus, gameEndedAt, markGameEnd])

  let screenEl: JSX.Element
  if (screen === 'landing') screenEl = <LandingPage />
  else if (screen === 'setup') screenEl = <SetupScreen />
  else if (screen === 'multiplayer-lobby') screenEl = <MultiplayerLobby />
  else if (screen === 'profile') screenEl = <ProfileScreen />
  else if (screen === 'leaderboard') screenEl = <LeaderboardScreen />
  else screenEl = (
    <div className="app">
      <div className="main-layout">
        <div className="canvas-area">
          <ChessScene />
        </div>
        <Sidebar />
      </div>
    </div>
  )

  return (
    <>
      {screenEl}
      {promotionPending && <PromotionModal />}
      <ProUpgradeModal />
      <SkinsShopModal />
      <AuthModal />
      <CoachReportModal />
      <GameOverModal />
    </>
  )
}
