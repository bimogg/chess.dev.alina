/**
 * AI Coach — honest post-game analysis.
 *
 * Uses Stockfish to walk through every move and produces a real verdict:
 *   • Average centipawn loss (ACPL) — the standard chess-engine metric
 *   • Lichess-style accuracy from win-probability deltas
 *   • Explicit best-move alternative for every blunder/mistake
 *   • Identifies the single decisive moment (largest swing) of the game
 *   • Writes a specific verdict, not a generic one ("on move 14 you …")
 */

import { Chess } from 'chess.js'
import { analyzePosition } from './engine'
import { MoveAnalysis } from '../types'

export interface CoachReport {
  totalMoves: number
  whiteBlunders: number
  whiteMistakes: number
  whiteInaccuracies: number
  blackBlunders: number
  blackMistakes: number
  blackInaccuracies: number
  whiteAccuracy: number       // 0–100
  blackAccuracy: number
  whiteAcpl: number            // average centipawn loss (lower = better)
  blackAcpl: number
  decisiveMoment: MoveAnalysis | null  // single move that swung the game most
  verdict: string              // 2–3 sentences, specific, no fluff
  moves: MoveAnalysis[]
}

export type CoachProgress = (current: number, total: number) => void

// ─── Win probability + accuracy (lichess-style) ────────────────────────────
// CP score → win-probability percentage (0–100).
// Formula: WP = 50 + 50 * (2 / (1 + e^{-0.00368208 * cp}) - 1)
function cpToWinProb(cpPawns: number): number {
  const cp = Math.max(-2000, Math.min(2000, cpPawns * 100))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

// Lichess accuracy curve from WP-loss for a single move
function moveAccuracy(wpLoss: number): number {
  // wpLoss is in [0, 100]; clamp
  const x = Math.max(0, wpLoss)
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * x) - 3.1669))
}

function classifyByCpLoss(cpLoss: number): MoveAnalysis['classification'] {
  // cpLoss is in centipawns, always ≥ 0
  if (cpLoss < 10)  return 'best'
  if (cpLoss < 50)  return 'good'
  if (cpLoss < 150) return 'inaccuracy'
  if (cpLoss < 300) return 'mistake'
  return 'blunder'
}

// ─── Convert UCI move (e.g. "e2e4", "e7e8q") to SAN in a given position ────
function uciToSan(fen: string, uci: string): string | undefined {
  try {
    const c = new Chess(fen)
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length > 4 ? uci[4] : undefined
    const move = c.move({ from, to, promotion })
    return move?.san
  } catch {
    return undefined
  }
}

// ─── Human-readable comment for a bad move ─────────────────────────────────
function commentFor(
  cls: MoveAnalysis['classification'],
  san: string,
  bestSan: string | undefined,
  cpLoss: number,
): string | undefined {
  if (cls === 'best' || cls === 'good') return undefined
  const cpStr = Math.round(cpLoss).toString()
  const lossPawns = (cpLoss / 100).toFixed(1)

  if (cls === 'blunder') {
    if (bestSan && bestSan !== san) {
      return `${san} loses ${lossPawns} pawns of advantage. Stockfish prefers ${bestSan} (−${cpStr} cp).`
    }
    return `${san} drops ${lossPawns} pawns — a critical blunder.`
  }
  if (cls === 'mistake') {
    if (bestSan && bestSan !== san) {
      return `${san} gives up ${lossPawns} pawns. ${bestSan} would have held the position.`
    }
    return `${san} costs you ${lossPawns} pawns of evaluation.`
  }
  // inaccuracy
  if (bestSan && bestSan !== san) {
    return `${san} is slightly inaccurate (−${cpStr} cp). ${bestSan} was sharper.`
  }
  return undefined
}

// ─── Main entry point ──────────────────────────────────────────────────────
export async function analyzeGame(
  pgn: string,
  onProgress?: CoachProgress,
): Promise<CoachReport> {
  const chess = new Chess()
  chess.loadPgn(pgn)
  // chess.js v1+ already attaches `before` and `after` FEN to each verbose
  // move — use those directly instead of replaying from a starting position.
  // This is correct even when the PGN starts from a custom FEN (Chess960 /
  // mid-game positions saved by the multiplayer flow).
  const history = chess.history({ verbose: true }) as Array<{
    color: 'w' | 'b'
    san: string
    before: string
    after: string
  }>

  const analyses: MoveAnalysis[] = []

  for (let i = 0; i < history.length; i++) {
    const move = history[i]
    const fenBefore = move.before
    const fenAfter = move.after

    // Analyze the position BEFORE the move — gives the best move the engine
    // sees here (the alternative we'll suggest to the user) and the eval.
    const before = await analyzePosition(fenBefore, 14)
    // Analyze the position AFTER — gives the eval the move actually produced.
    const after = await analyzePosition(fenAfter, 14)

    // Express both evals from the MOVING side's perspective
    const sideMult = move.color === 'w' ? 1 : -1
    const evalBeforeForMover = before.score * sideMult
    const evalAfterForMover  = after.score * sideMult

    // Win-probability loss for the mover
    const wpBefore = cpToWinProb(evalBeforeForMover)
    const wpAfter  = cpToWinProb(evalAfterForMover)
    const wpLoss   = Math.max(0, wpBefore - wpAfter)

    // Centipawn loss (always ≥ 0). Converts pawn diff → centipawns.
    const cpLoss = Math.max(0, (evalBeforeForMover - evalAfterForMover) * 100)

    const cls = classifyByCpLoss(cpLoss)
    const bestSan = before.bestMove ? uciToSan(fenBefore, before.bestMove) : undefined
    const comment = commentFor(cls, move.san, bestSan, cpLoss)

    analyses.push({
      moveNumber: Math.floor(i / 2) + 1,
      ply: i,
      san: move.san,
      color: move.color,
      evalBefore: before.score,
      evalAfter: after.score,
      delta: wpLoss,
      cpLoss,
      classification: cls,
      bestMoveSan: bestSan,
      comment,
    })

    onProgress?.(i + 1, history.length)
  }

  // ─── Aggregate stats ────────────────────────────────────────────────────
  const stats = {
    whiteBlunders: 0, whiteMistakes: 0, whiteInaccuracies: 0,
    blackBlunders: 0, blackMistakes: 0, blackInaccuracies: 0,
  }
  let whiteAccSum = 0, whiteAccCount = 0, whiteCpLossSum = 0
  let blackAccSum = 0, blackAccCount = 0, blackCpLossSum = 0

  for (const a of analyses) {
    const isWhite = a.color === 'w'
    if (a.classification === 'blunder') {
      isWhite ? stats.whiteBlunders++ : stats.blackBlunders++
    } else if (a.classification === 'mistake') {
      isWhite ? stats.whiteMistakes++ : stats.blackMistakes++
    } else if (a.classification === 'inaccuracy') {
      isWhite ? stats.whiteInaccuracies++ : stats.blackInaccuracies++
    }
    const acc = moveAccuracy(a.delta)
    if (isWhite) {
      whiteAccSum += acc; whiteAccCount++; whiteCpLossSum += a.cpLoss
    } else {
      blackAccSum += acc; blackAccCount++; blackCpLossSum += a.cpLoss
    }
  }

  const whiteAccuracy = whiteAccCount > 0 ? Math.round(whiteAccSum / whiteAccCount) : 0
  const blackAccuracy = blackAccCount > 0 ? Math.round(blackAccSum / blackAccCount) : 0
  const whiteAcpl = whiteAccCount > 0 ? Math.round(whiteCpLossSum / whiteAccCount) : 0
  const blackAcpl = blackAccCount > 0 ? Math.round(blackCpLossSum / blackAccCount) : 0

  // Decisive moment = single move with the largest cpLoss
  const decisiveMoment = analyses.reduce<MoveAnalysis | null>((best, m) => {
    if (m.classification !== 'blunder' && m.classification !== 'mistake') return best
    if (!best || m.cpLoss > best.cpLoss) return m
    return best
  }, null)

  const verdict = buildVerdict(
    stats, whiteAccuracy, blackAccuracy, whiteAcpl, blackAcpl, decisiveMoment,
  )

  return {
    totalMoves: history.length,
    ...stats,
    whiteAccuracy,
    blackAccuracy,
    whiteAcpl,
    blackAcpl,
    decisiveMoment,
    verdict,
    moves: analyses,
  }
}

// ─── Verdict builder ───────────────────────────────────────────────────────
function buildVerdict(
  s: { whiteBlunders: number; whiteMistakes: number; blackBlunders: number; blackMistakes: number },
  wAcc: number, bAcc: number,
  wAcpl: number, bAcpl: number,
  decisive: MoveAnalysis | null,
): string {
  const parts: string[] = []

  // Headline accuracy line
  parts.push(`White ${wAcc}% accuracy (ACPL ${wAcpl}), Black ${bAcc}% accuracy (ACPL ${bAcpl}).`)

  // Decisive moment in plain language — this is the main "judgement"
  if (decisive) {
    const side = decisive.color === 'w' ? 'White' : 'Black'
    const num = decisive.color === 'w'
      ? `${decisive.moveNumber}.`
      : `${decisive.moveNumber}…`
    if (decisive.bestMoveSan && decisive.bestMoveSan !== decisive.san) {
      parts.push(
        `The decisive moment was ${num} ${decisive.san} — ${side} should have played ${decisive.bestMoveSan} instead, losing ~${(decisive.cpLoss / 100).toFixed(1)} pawns of evaluation here.`,
      )
    } else {
      parts.push(
        `The decisive moment was ${num} ${decisive.san} (${side}) — losing ~${(decisive.cpLoss / 100).toFixed(1)} pawns.`,
      )
    }
  } else if (s.whiteBlunders + s.blackBlunders + s.whiteMistakes + s.blackMistakes === 0) {
    parts.push('No real mistakes from either side — a clean, well-played game.')
  } else {
    parts.push('Both sides held the position well — no single move decided the game.')
  }

  // Side comparison — short and honest
  if (wAcpl < bAcpl - 30) {
    parts.push('Overall White played more accurately.')
  } else if (bAcpl < wAcpl - 30) {
    parts.push('Overall Black played more accurately.')
  } else if (wAcpl < 30 && bAcpl < 30) {
    parts.push('Both sides played at a strong, near-engine level.')
  }

  return parts.join(' ')
}
