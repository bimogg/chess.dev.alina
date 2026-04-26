import { Chess } from 'chess.js'
import { GameStatus } from '../types'

export function squareToPos(square: string): [number, number, number] {
  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]) - 1
  return [file - 3.5, 0, (7 - rank) - 3.5]
}

export function posToSquare(file: number, rank: number): string {
  return String.fromCharCode(97 + file) + (rank + 1)
}

export function computeGameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'draw'
  if (chess.inCheck()) return 'check'
  return 'playing'
}

export function computeCapturedPieces(chess: Chess): { w: string[]; b: string[] } {
  const captured = { w: [] as string[], b: [] as string[] }
  chess.history({ verbose: true }).forEach(move => {
    if (move.captured) {
      captured[move.color].push(move.captured)
    }
  })
  return captured
}

export const PIECE_SYMBOLS: Record<string, { w: string; b: string }> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
}

export const PIECE_NAMES: Record<string, string> = {
  k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn'
}
