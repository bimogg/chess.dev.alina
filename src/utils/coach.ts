/**
 * AI Coach — post-game analysis.
 * Walks through every move and uses Stockfish to find blunders & inaccuracies.
 */

import { Chess } from 'chess.js'
import { evaluatePosition } from './engine'
import { MoveAnalysis } from '../types'

export interface CoachReport {
  totalMoves: number
  whiteBlunders: number
  whiteMistakes: number
  whiteInaccuracies: number
  blackBlunders: number
  blackMistakes: number
  blackInaccuracies: number
  whiteAccuracy: number
  blackAccuracy: number
  moves: MoveAnalysis[]
  summary: string
}

function classifyDelta(delta: number): MoveAnalysis['classification'] {
  // delta is from the perspective of the side that just moved — positive = good for them
  if (delta >= -0.2) return 'best'
  if (delta >= -0.6) return 'good'
  if (delta >= -1.5) return 'inaccuracy'
  if (delta >= -3.0) return 'mistake'
  return 'blunder'
}

export type CoachProgress = (current: number, total: number) => void

export async function analyzeGame(
  pgn: string,
  onProgress?: CoachProgress
): Promise<CoachReport> {
  const chess = new Chess()
  chess.loadPgn(pgn)
  const history = chess.history({ verbose: true })

  // Replay from start, evaluate each ply
  const replay = new Chess()
  const analyses: MoveAnalysis[] = []

  for (let i = 0; i < history.length; i++) {
    const move = history[i]
    const fenBefore = replay.fen()
    const evalBefore = await evaluatePosition(fenBefore, 12)
    replay.move(move)
    const fenAfter = replay.fen()
    const evalAfter = await evaluatePosition(fenAfter, 12)

    // Convert eval to side-perspective
    // evalBefore is from white's POV, after move it's now opponent's turn
    // The delta for the mover: their eval (from their POV) before vs after
    const sideMult = move.color === 'w' ? 1 : -1
    const evalBeforeForMover = evalBefore * sideMult
    const evalAfterForMover = evalAfter * sideMult
    const delta = evalAfterForMover - evalBeforeForMover

    analyses.push({
      moveNumber: Math.floor(i / 2) + 1,
      san: move.san,
      color: move.color,
      evalBefore,
      evalAfter,
      delta,
      classification: classifyDelta(delta),
    })

    onProgress?.(i + 1, history.length)
  }

  // Aggregate
  const stats = {
    whiteBlunders: 0, whiteMistakes: 0, whiteInaccuracies: 0,
    blackBlunders: 0, blackMistakes: 0, blackInaccuracies: 0,
  }
  let whiteSum = 0, whiteCount = 0
  let blackSum = 0, blackCount = 0

  analyses.forEach((a) => {
    const isWhite = a.color === 'w'
    if (a.classification === 'blunder') {
      isWhite ? stats.whiteBlunders++ : stats.blackBlunders++
    } else if (a.classification === 'mistake') {
      isWhite ? stats.whiteMistakes++ : stats.blackMistakes++
    } else if (a.classification === 'inaccuracy') {
      isWhite ? stats.whiteInaccuracies++ : stats.blackInaccuracies++
    }
    // accuracy ~ how close to "best" each move was
    const acc = Math.max(0, 100 + a.delta * 25) // delta=0 → 100, delta=-2 → 50
    if (isWhite) { whiteSum += Math.min(100, acc); whiteCount++ }
    else { blackSum += Math.min(100, acc); blackCount++ }
  })

  const whiteAccuracy = whiteCount > 0 ? Math.round(whiteSum / whiteCount) : 0
  const blackAccuracy = blackCount > 0 ? Math.round(blackSum / blackCount) : 0

  const summary = buildSummary(stats, whiteAccuracy, blackAccuracy)

  return {
    totalMoves: history.length,
    ...stats,
    whiteAccuracy,
    blackAccuracy,
    moves: analyses,
    summary,
  }
}

function buildSummary(
  s: { whiteBlunders: number; whiteMistakes: number; blackBlunders: number; blackMistakes: number },
  wAcc: number,
  bAcc: number,
): string {
  const parts: string[] = []
  parts.push(`White accuracy: ${wAcc}% • Black accuracy: ${bAcc}%.`)
  if (s.whiteBlunders + s.blackBlunders === 0) {
    parts.push('No major blunders — well played by both sides.')
  } else {
    if (s.whiteBlunders > s.blackBlunders) {
      parts.push(`White lost the game with ${s.whiteBlunders} blunder${s.whiteBlunders > 1 ? 's' : ''}.`)
    } else if (s.blackBlunders > s.whiteBlunders) {
      parts.push(`Black blundered ${s.blackBlunders} time${s.blackBlunders > 1 ? 's' : ''} — costly mistakes.`)
    } else {
      parts.push(`Both sides had ${s.whiteBlunders} blunder${s.whiteBlunders > 1 ? 's' : ''}.`)
    }
  }
  return parts.join(' ')
}
