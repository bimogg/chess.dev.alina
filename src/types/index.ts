export type PieceColor = 'w' | 'b'
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
export type GameMode = 'local' | 'vs-ai' | 'multiplayer'
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'
export type Screen = 'landing' | 'setup' | 'game' | 'multiplayer-lobby' | 'profile' | 'leaderboard'
export type BoardTheme = 'classic' | 'green' | 'walnut' | 'ice' | 'crimson'
export type AppTheme = 'dark' | 'light'
export type Difficulty = 1 | 2 | 3 | 4 | 5
export type PieceSkin = 'classic' | 'gold' | 'marble' | 'neon'

export interface SavedGame {
  id: string
  pgn: string
  date: string
  status: GameStatus
  moves: number
  mode: GameMode
}

export interface SetupConfig {
  mode: GameMode
  playerColor: 'w' | 'b'
  focusMode: boolean
  boardTheme: BoardTheme
  difficulty: Difficulty
  pieceSkin: PieceSkin
}

export interface UserProfile {
  id: string
  username: string
  city: string
  elo: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  isPro: boolean
}

export interface LeaderboardEntry {
  username: string
  city: string
  elo: number
  wins: number
  isPro: boolean
}

export interface MoveAnalysis {
  moveNumber: number
  ply: number                  // half-move index (0-based)
  san: string
  color: 'w' | 'b'
  evalBefore: number           // pawns, white POV
  evalAfter: number
  delta: number                // win-prob loss for the mover, 0–100 scale
  cpLoss: number               // centipawn loss for the mover (always ≥ 0)
  classification: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'
  bestMoveSan?: string         // what Stockfish would have played
  comment?: string             // human-readable judgement, e.g. "drops a knight"
}
