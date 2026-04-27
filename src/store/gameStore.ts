import { create } from 'zustand'
import { Chess } from 'chess.js'
import {
  GameMode, GameStatus, SavedGame, Screen, BoardTheme, SetupConfig,
  AppTheme, Difficulty, PieceSkin, UserProfile,
} from '../types'
import { computeGameStatus, computeCapturedPieces } from '../utils/chess'
import {
  getSavedGames, saveGame, deleteGame as storageDeleteGame,
  saveCurrentFen, loadCurrentFen,
  getAppTheme, saveAppTheme,
  getPieceSkin, savePieceSkin, getOwnedSkins, unlockSkin,
  getProfile as localGetProfile, saveProfile as localSaveProfile, clearProfile as localClearProfile,
  isProUser, setProUser,
} from '../utils/storage'
import { getBestMove, initEngine } from '../utils/engine'
import {
  hostRoom, joinRoom, send as mpSend, cleanup as mpCleanup,
  getRoomLink, MpMessage,
} from '../utils/multiplayer'
import {
  isSupabaseEnabled, getCurrentUser, getProfile as remoteGetProfile,
  upsertProfile, signOut as supaSignOut, recordGameResult,
} from '../utils/supabase'
import { CoachReport, analyzeGame } from '../utils/coach'

interface GameStore {
  // Navigation
  screen: Screen

  // Game state
  chess: Chess
  selectedSquare: string | null
  legalMoveSquares: string[]
  gameMode: GameMode
  playerColor: 'w' | 'b'
  focusMode: boolean
  boardTheme: BoardTheme
  difficulty: Difficulty
  pieceSkin: PieceSkin
  ownedSkins: PieceSkin[]
  promotionPending: { from: string; to: string } | null
  capturedPieces: { w: string[]; b: string[] }
  gameStatus: GameStatus
  savedGames: SavedGame[]
  lastMove: { from: string; to: string } | null
  aiThinking: boolean
  hintSquare: string | null
  hintToSquare: string | null

  // App theme + Pro
  appTheme: AppTheme
  isPro: boolean

  // Profile (local or remote)
  profile: UserProfile | null

  // Multiplayer
  mpRoomLink: string | null
  mpStatus: 'idle' | 'hosting' | 'joining' | 'connected' | 'error'
  mpError: string | null

  // AI Coach
  coachReport: CoachReport | null
  coachAnalyzing: boolean
  coachProgress: { current: number; total: number } | null

  // Modals
  showProUpgrade: boolean
  showSkinsShop: boolean
  showAuthModal: boolean

  // ─── Navigation ───────────────────────────────────────
  goToLanding: () => void
  goToSetup: () => void
  goToLeaderboard: () => void
  goToProfile: () => void
  goToMultiplayerLobby: () => void
  startGame: (config: SetupConfig) => void

  // ─── Game actions ─────────────────────────────────────
  selectSquare: (square: string) => void
  completePromotion: (piece: string) => void
  resetGame: () => void
  setGameMode: (mode: GameMode) => void
  setPlayerColor: (color: 'w' | 'b') => void
  toggleFocusMode: () => void
  saveCurrentGame: () => void
  loadGame: (id: string) => void
  deleteGame: (id: string) => void
  undoMove: () => void
  requestHint: () => void
  clearHint: () => void

  // ─── App theme + skins ────────────────────────────────
  setAppTheme: (t: AppTheme) => void
  toggleAppTheme: () => void
  setPieceSkin: (s: PieceSkin) => void

  // ─── Pro / shop ───────────────────────────────────────
  openProUpgrade: () => void
  closeProUpgrade: () => void
  openSkinsShop: () => void
  closeSkinsShop: () => void
  buyPro: () => void
  buySkin: (skin: PieceSkin) => void

  // ─── Auth ─────────────────────────────────────────────
  openAuthModal: () => void
  closeAuthModal: () => void
  loadProfile: () => Promise<void>
  signOut: () => Promise<void>
  setLocalProfile: (username: string, city: string) => void
  refreshProfile: () => Promise<void>

  // ─── Multiplayer ──────────────────────────────────────
  hostMultiplayer: () => Promise<void>
  joinMultiplayer: (roomId: string) => Promise<void>
  leaveMultiplayer: () => void

  // ─── AI Coach ─────────────────────────────────────────
  runCoachAnalysis: () => Promise<void>
  closeCoachReport: () => void
}

function needsPromotion(chess: Chess, from: string, to: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const piece = chess.get(from as any)
  if (!piece || piece.type !== 'p') return false
  const toRank = parseInt(to[1])
  return (piece.color === 'w' && toRank === 8) || (piece.color === 'b' && toRank === 1)
}

function applyAppTheme(t: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = t
}

async function runStockfishMove(
  chess: Chess,
  difficulty: Difficulty,
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  set({ aiThinking: true })
  try {
    const move = await getBestMove(chess.fen(), difficulty)
    if (!move) { set({ aiThinking: false }); return }
    // Validate it's still our turn (game might have been reset)
    const current = get().chess
    if (current !== chess) { set({ aiThinking: false }); return }
    const moved = chess.move(move)
    if (!moved) { set({ aiThinking: false }); return }
    saveCurrentFen(chess.pgn())
    const newStatus = computeGameStatus(chess)
    set({
      aiThinking: false,
      capturedPieces: computeCapturedPieces(chess),
      gameStatus: newStatus,
      lastMove: { from: moved.from, to: moved.to },
    })
    // Track game result for ranked play
    void maybeRecordResult(get(), newStatus)
  } catch (e) {
    console.error('[AI move]', e)
    set({ aiThinking: false })
  }
}

async function maybeRecordResult(state: GameStore, status: GameStatus) {
  if (status !== 'checkmate' && status !== 'stalemate' && status !== 'draw') return
  if (state.gameMode !== 'vs-ai') return
  if (!state.profile) return
  // In checkmate, the side to move just LOST.
  const turn = state.chess.turn()
  let result: 'win' | 'loss' | 'draw'
  if (status === 'checkmate') {
    result = turn === state.playerColor ? 'loss' : 'win'
  } else {
    result = 'draw'
  }
  if (isSupabaseEnabled()) {
    try { await recordGameResult(state.profile.id, result, 1200 + state.difficulty * 100) } catch { /* ignore */ }
  } else {
    // Local-only: bump local profile elo
    const k = 16
    const expected = 0.5
    const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
    const newElo = Math.round(state.profile.elo + k * (score - expected))
    const updated: UserProfile = {
      ...state.profile,
      elo: newElo,
      gamesPlayed: state.profile.gamesPlayed + 1,
      wins: state.profile.wins + (result === 'win' ? 1 : 0),
      losses: state.profile.losses + (result === 'loss' ? 1 : 0),
      draws: state.profile.draws + (result === 'draw' ? 1 : 0),
    }
    localSaveProfile(updated)
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  // Initial app theme — apply immediately
  const initialTheme = getAppTheme()
  applyAppTheme(initialTheme)

  // Eagerly init engine
  void initEngine()

  // Initial profile (local fallback; remote check happens via loadProfile())
  const initialProfile = localGetProfile()

  return {
    screen: 'landing',

    chess: (() => {
      const c = new Chess()
      const saved = loadCurrentFen()
      if (saved) { try { c.loadPgn(saved) } catch { /* ignore */ } }
      return c
    })(),
    selectedSquare: null,
    legalMoveSquares: [],
    gameMode: 'local',
    playerColor: 'w',
    focusMode: false,
    boardTheme: 'classic',
    difficulty: 3,
    pieceSkin: getPieceSkin(),
    ownedSkins: getOwnedSkins(),
    promotionPending: null,
    capturedPieces: { w: [], b: [] },
    gameStatus: 'playing',
    savedGames: getSavedGames(),
    lastMove: null,
    aiThinking: false,
    hintSquare: null,
    hintToSquare: null,

    appTheme: initialTheme,
    isPro: isProUser(),
    profile: initialProfile,

    mpRoomLink: null,
    mpStatus: 'idle',
    mpError: null,

    coachReport: null,
    coachAnalyzing: false,
    coachProgress: null,

    showProUpgrade: false,
    showSkinsShop: false,
    showAuthModal: false,

    // ─── Navigation ────────────────────────────────────
    goToLanding() {
      set({ screen: 'landing', hintSquare: null, hintToSquare: null })
    },
    goToSetup() { set({ screen: 'setup' }) },
    goToLeaderboard() { set({ screen: 'leaderboard' }) },
    goToProfile() { set({ screen: 'profile' }) },
    goToMultiplayerLobby() { set({ screen: 'multiplayer-lobby' }) },

    startGame(config: SetupConfig) {
      const chess = new Chess()
      saveCurrentFen('')
      savePieceSkin(config.pieceSkin)
      set({
        screen: 'game',
        chess,
        gameMode: config.mode,
        playerColor: config.playerColor,
        focusMode: config.focusMode,
        boardTheme: config.boardTheme,
        difficulty: config.difficulty,
        pieceSkin: config.pieceSkin,
        selectedSquare: null,
        legalMoveSquares: [],
        promotionPending: null,
        capturedPieces: { w: [], b: [] },
        gameStatus: 'playing',
        lastMove: null,
        aiThinking: false,
        hintSquare: null,
        hintToSquare: null,
        coachReport: null,
      })
      if (config.mode === 'vs-ai' && config.playerColor === 'b') {
        setTimeout(() => runStockfishMove(chess, config.difficulty, set, get), 600)
      }
    },

    // ─── Game actions ──────────────────────────────────
    selectSquare(square: string) {
      const { chess, selectedSquare, gameMode, playerColor, gameStatus, difficulty } = get()
      if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw') return

      const turn = chess.turn()
      if (gameMode === 'vs-ai' && turn !== playerColor) return
      if (gameMode === 'multiplayer' && turn !== playerColor) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const piece = chess.get(square as any)

      if (selectedSquare) {
        if (selectedSquare === square) {
          set({ selectedSquare: null, legalMoveSquares: [], hintSquare: null, hintToSquare: null })
          return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const legalMoves = chess.moves({ square: selectedSquare as any, verbose: true })
        const targetMove = legalMoves.find(m => m.to === square)

        if (targetMove) {
          if (needsPromotion(chess, selectedSquare, square)) {
            set({ promotionPending: { from: selectedSquare, to: square }, selectedSquare: null, legalMoveSquares: [] })
            return
          }

          chess.move({ from: selectedSquare, to: square })
          const newStatus = computeGameStatus(chess)
          const captured = computeCapturedPieces(chess)
          saveCurrentFen(chess.pgn())

          set({
            selectedSquare: null,
            legalMoveSquares: [],
            capturedPieces: captured,
            gameStatus: newStatus,
            lastMove: { from: selectedSquare, to: square },
            hintSquare: null,
            hintToSquare: null,
          })

          if (gameMode === 'multiplayer') {
            mpSend({ type: 'move', from: selectedSquare, to: square, pgn: chess.pgn(), fen: chess.fen() })
          }
          if (gameMode === 'vs-ai' && !chess.isGameOver()) {
            setTimeout(() => runStockfishMove(chess, difficulty, set, get), 80)
          }
          if (chess.isGameOver()) {
            void maybeRecordResult(get(), newStatus)
          }
          return
        }

        if (piece && piece.color === turn) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const moves = chess.moves({ square: square as any, verbose: true })
          set({ selectedSquare: square, legalMoveSquares: moves.map(m => m.to) })
          return
        }

        set({ selectedSquare: null, legalMoveSquares: [] })
        return
      }

      if (piece && piece.color === turn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const moves = chess.moves({ square: square as any, verbose: true })
        set({ selectedSquare: square, legalMoveSquares: moves.map(m => m.to) })
      }
    },

    completePromotion(piece: string) {
      const { chess, promotionPending, gameMode, difficulty } = get()
      if (!promotionPending) return

      chess.move({ from: promotionPending.from, to: promotionPending.to, promotion: piece })
      const newStatus = computeGameStatus(chess)
      const captured = computeCapturedPieces(chess)
      saveCurrentFen(chess.pgn())

      set({
        promotionPending: null,
        capturedPieces: captured,
        gameStatus: newStatus,
        lastMove: { from: promotionPending.from, to: promotionPending.to },
      })

      if (gameMode === 'multiplayer') {
        mpSend({
          type: 'move',
          from: promotionPending.from,
          to: promotionPending.to,
          promotion: piece,
          pgn: chess.pgn(),
          fen: chess.fen(),
        })
      }
      if (gameMode === 'vs-ai' && !chess.isGameOver()) {
        setTimeout(() => runStockfishMove(chess, difficulty, set, get), 80)
      }
      if (chess.isGameOver()) {
        void maybeRecordResult(get(), newStatus)
      }
    },

    resetGame() {
      const { gameMode, playerColor, focusMode, boardTheme, difficulty } = get()
      const chess = new Chess()
      saveCurrentFen('')
      set({
        chess,
        selectedSquare: null,
        legalMoveSquares: [],
        promotionPending: null,
        capturedPieces: { w: [], b: [] },
        gameStatus: 'playing',
        lastMove: null,
        aiThinking: false,
        hintSquare: null,
        hintToSquare: null,
        coachReport: null,
      })
      if (gameMode === 'vs-ai' && playerColor === 'b') {
        setTimeout(() => runStockfishMove(chess, difficulty, set, get), 600)
      }
      void focusMode; void boardTheme
    },

    setGameMode(mode: GameMode) {
      set({ gameMode: mode })
      get().resetGame()
    },

    setPlayerColor(color: 'w' | 'b') {
      set({ playerColor: color })
      get().resetGame()
    },

    toggleFocusMode() { set(s => ({ focusMode: !s.focusMode })) },

    saveCurrentGame() {
      const { chess, gameStatus, gameMode } = get()
      const history = chess.history()
      if (history.length === 0) return

      const game: SavedGame = {
        id: Date.now().toString(),
        pgn: chess.pgn(),
        date: new Date().toLocaleDateString(),
        status: gameStatus,
        moves: history.length,
        mode: gameMode,
      }
      saveGame(game)
      set({ savedGames: getSavedGames() })
    },

    loadGame(id: string) {
      const { savedGames } = get()
      const game = savedGames.find(g => g.id === id)
      if (!game) return

      const chess = new Chess()
      try {
        chess.loadPgn(game.pgn)
        set({
          chess,
          screen: 'game',
          selectedSquare: null,
          legalMoveSquares: [],
          capturedPieces: computeCapturedPieces(chess),
          gameStatus: computeGameStatus(chess),
          lastMove: null,
          aiThinking: false,
          hintSquare: null,
          hintToSquare: null,
          coachReport: null,
        })
      } catch { /* ignore */ }
    },

    deleteGame(id: string) {
      storageDeleteGame(id)
      set({ savedGames: getSavedGames() })
    },

    undoMove() {
      const { chess, gameMode } = get()
      chess.undo()
      if (gameMode === 'vs-ai') chess.undo()
      saveCurrentFen(chess.pgn())
      set({
        selectedSquare: null,
        legalMoveSquares: [],
        capturedPieces: computeCapturedPieces(chess),
        gameStatus: computeGameStatus(chess),
        lastMove: null,
        hintSquare: null,
        hintToSquare: null,
      })
    },

    requestHint() {
      const { chess } = get()
      const moves = chess.moves({ verbose: true })
      if (moves.length === 0) return

      const captures = moves.filter(m => m.captured)
      const checks = moves.filter(m => m.san.includes('+'))
      const pool = captures.length > 0 ? captures : checks.length > 0 ? checks : moves
      const pick = pool[Math.floor(Math.random() * pool.length)]

      set({ hintSquare: pick.from, hintToSquare: pick.to })
      setTimeout(() => set({ hintSquare: null, hintToSquare: null }), 4000)
    },

    clearHint() { set({ hintSquare: null, hintToSquare: null }) },

    // ─── App theme + skins ─────────────────────────────
    setAppTheme(t: AppTheme) {
      saveAppTheme(t)
      applyAppTheme(t)
      set({ appTheme: t })
    },
    toggleAppTheme() {
      const next: AppTheme = get().appTheme === 'dark' ? 'light' : 'dark'
      get().setAppTheme(next)
    },
    setPieceSkin(s: PieceSkin) {
      savePieceSkin(s)
      set({ pieceSkin: s })
    },

    // ─── Pro / shop ────────────────────────────────────
    openProUpgrade() { set({ showProUpgrade: true }) },
    closeProUpgrade() { set({ showProUpgrade: false }) },
    openSkinsShop() { set({ showSkinsShop: true }) },
    closeSkinsShop() { set({ showSkinsShop: false }) },
    buyPro() {
      setProUser(true)
      // Unlock all skins for Pro users
      ;(['gold', 'marble', 'neon'] as PieceSkin[]).forEach(unlockSkin)
      set({ isPro: true, ownedSkins: getOwnedSkins(), showProUpgrade: false })
      // If signed in, sync to remote
      const p = get().profile
      if (p) {
        const updated = { ...p, isPro: true }
        if (isSupabaseEnabled()) void upsertProfile(updated)
        else localSaveProfile(updated)
        set({ profile: updated })
      }
    },
    buySkin(skin: PieceSkin) {
      unlockSkin(skin)
      savePieceSkin(skin)
      set({ ownedSkins: getOwnedSkins(), pieceSkin: skin })
    },

    // ─── Auth ─────────────────────────────────────────
    openAuthModal() { set({ showAuthModal: true }) },
    closeAuthModal() { set({ showAuthModal: false }) },

    async loadProfile() {
      if (isSupabaseEnabled()) {
        try {
          const user = await getCurrentUser()
          if (user) {
            const remote = await remoteGetProfile(user.id)
            if (remote) {
              localSaveProfile(remote)
              set({ profile: remote, isPro: remote.isPro })
              setProUser(remote.isPro)
              return
            }
          }
        } catch (e) {
          console.warn('[Profile] remote fetch failed', e)
        }
      }
      const local = localGetProfile()
      set({ profile: local })
    },

    async signOut() {
      if (isSupabaseEnabled()) {
        try { await supaSignOut() } catch { /* ignore */ }
      }
      localClearProfile()
      set({ profile: null })
    },

    setLocalProfile(username: string, city: string) {
      const profile: UserProfile = {
        id: 'local-' + Date.now(),
        username,
        city,
        elo: 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        isPro: get().isPro,
      }
      localSaveProfile(profile)
      set({ profile, showAuthModal: false })
    },

    async refreshProfile() { await get().loadProfile() },

    // ─── Multiplayer ──────────────────────────────────
    async hostMultiplayer() {
      set({ mpStatus: 'hosting', mpError: null })
      try {
        const roomId = await hostRoom({
          onConnect: () => {
            // Host plays white by default
            const chess = new Chess()
            saveCurrentFen('')
            set({
              mpStatus: 'connected',
              screen: 'game',
              chess,
              gameMode: 'multiplayer',
              playerColor: 'w',
              selectedSquare: null,
              legalMoveSquares: [],
              capturedPieces: { w: [], b: [] },
              gameStatus: 'playing',
              lastMove: null,
            })
          },
          onDisconnect: () => set({ mpStatus: 'idle' }),
          onError: (err) => set({ mpStatus: 'error', mpError: err }),
          onMessage: (msg) => handleMpMessage(msg, set, get),
        })
        set({ mpRoomLink: getRoomLink(roomId) })
      } catch (e) {
        set({ mpStatus: 'error', mpError: (e as Error).message })
      }
    },

    async joinMultiplayer(roomId: string) {
      set({ mpStatus: 'joining', mpError: null })
      try {
        await joinRoom(roomId, {
          onConnect: () => {
            const chess = new Chess()
            saveCurrentFen('')
            set({
              mpStatus: 'connected',
              screen: 'game',
              chess,
              gameMode: 'multiplayer',
              playerColor: 'b',
              selectedSquare: null,
              legalMoveSquares: [],
              capturedPieces: { w: [], b: [] },
              gameStatus: 'playing',
              lastMove: null,
            })
          },
          onDisconnect: () => set({ mpStatus: 'idle' }),
          onError: (err) => set({ mpStatus: 'error', mpError: err }),
          onMessage: (msg) => handleMpMessage(msg, set, get),
        })
      } catch (e) {
        set({ mpStatus: 'error', mpError: (e as Error).message })
      }
    },

    leaveMultiplayer() {
      mpCleanup()
      set({ mpStatus: 'idle', mpRoomLink: null, mpError: null })
    },

    // ─── AI Coach ─────────────────────────────────────
    async runCoachAnalysis() {
      const { chess } = get()
      if (chess.history().length === 0) return
      set({ coachAnalyzing: true, coachReport: null, coachProgress: { current: 0, total: chess.history().length } })
      try {
        const report = await analyzeGame(chess.pgn(), (cur, total) => {
          set({ coachProgress: { current: cur, total } })
        })
        set({ coachReport: report, coachAnalyzing: false, coachProgress: null })
      } catch (e) {
        console.error('[Coach]', e)
        set({ coachAnalyzing: false, coachProgress: null })
      }
    },
    closeCoachReport() { set({ coachReport: null }) },
  }
})

function handleMpMessage(
  msg: MpMessage,
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  if (msg.type === 'move') {
    // Use sender board state as source of truth to avoid Safari/mobile desyncs.
    // FEN is deterministic and lighter to parse than full PGN.
    const fromFen = new Chess()
    try {
      fromFen.load(msg.fen)
      set({
        chess: fromFen,
        selectedSquare: null,
        legalMoveSquares: [],
        promotionPending: null,
        capturedPieces: computeCapturedPieces(fromFen),
        gameStatus: computeGameStatus(fromFen),
        lastMove: { from: msg.from, to: msg.to },
        hintSquare: null,
        hintToSquare: null,
      })
      saveCurrentFen(fromFen.pgn())
      return
    } catch {
      // Fallback below for backward compatibility with older payloads.
    }

    // Fallback: sender PGN as source of truth.
    const next = new Chess()
    try {
      next.loadPgn(msg.pgn)
      set({
        chess: next,
        selectedSquare: null,
        legalMoveSquares: [],
        promotionPending: null,
        capturedPieces: computeCapturedPieces(next),
        gameStatus: computeGameStatus(next),
        lastMove: { from: msg.from, to: msg.to },
        hintSquare: null,
        hintToSquare: null,
      })
      saveCurrentFen(next.pgn())
      return
    } catch {
      // Fallback for backward compatibility with any old payloads.
    }

    const { chess } = get()
    try {
      chess.move({ from: msg.from, to: msg.to, promotion: msg.promotion })
      set({
        selectedSquare: null,
        legalMoveSquares: [],
        promotionPending: null,
        capturedPieces: computeCapturedPieces(chess),
        gameStatus: computeGameStatus(chess),
        lastMove: { from: msg.from, to: msg.to },
        hintSquare: null,
        hintToSquare: null,
      })
      saveCurrentFen(chess.pgn())
    } catch { /* ignore */ }
  }
}

// Auto-load profile on startup if Supabase is enabled
if (typeof window !== 'undefined') {
  setTimeout(() => useGameStore.getState().loadProfile(), 200)
}
