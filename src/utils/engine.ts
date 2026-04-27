/**
 * Stockfish UCI wrapper.
 * Loads the engine as a Web Worker from /stockfish/stockfish.js.
 * Falls back to a smart heuristic AI if Stockfish fails to load.
 */

import { Chess } from 'chess.js'

let worker: Worker | null = null
let isReady = false
let initPromise: Promise<boolean> | null = null

type BestMoveResolver = (move: { from: string; to: string; promotion?: string } | null) => void
type EvalResolver = (score: number) => void

let currentBestMoveResolver: BestMoveResolver | null = null
let currentEvalResolver: EvalResolver | null = null
let lastEvalScore: number | null = null

// Map UI difficulty (1–5) to Stockfish skill level + depth
const DIFFICULTY_SETTINGS = {
  1: { skill: 0,  depth: 1,  movetimeMs: 50 },   // Beginner
  2: { skill: 5,  depth: 4,  movetimeMs: 200 },  // Easy
  3: { skill: 10, depth: 8,  movetimeMs: 500 },  // Medium
  4: { skill: 15, depth: 12, movetimeMs: 1200 }, // Hard
  5: { skill: 20, depth: 18, movetimeMs: 2500 }, // Expert
} as const

export type Difficulty = keyof typeof DIFFICULTY_SETTINGS

export function initEngine(): Promise<boolean> {
  if (isReady) return Promise.resolve(true)
  if (initPromise) return initPromise

  initPromise = new Promise((resolve) => {
    try {
      // Try real Stockfish first
      worker = new Worker('/stockfish/stockfish.js')
    } catch {
      console.warn('[Engine] Stockfish worker not available, falling back to heuristic AI')
      resolve(false)
      return
    }

    const timeout = setTimeout(() => {
      console.warn('[Engine] Stockfish init timed out, falling back')
      resolve(false)
    }, 20000) // first WASM load can take ~10s on slow connections

    worker.onerror = () => {
      clearTimeout(timeout)
      console.warn('[Engine] Stockfish error, falling back to heuristic AI')
      worker = null
      resolve(false)
    }

    worker.onmessage = (e) => {
      const msg = typeof e.data === 'string' ? e.data : (e.data?.toString() ?? '')
      if (!msg) return

      if (msg.includes('uciok')) {
        worker?.postMessage('setoption name Skill Level value 10')
        worker?.postMessage('isready')
        return
      }
      if (msg.includes('readyok') && !isReady) {
        isReady = true
        clearTimeout(timeout)
        console.info('[Engine] Stockfish ready')
        resolve(true)
        return
      }

      // Eval info
      if (msg.startsWith('info') && msg.includes(' score ')) {
        const m = msg.match(/score (cp|mate) (-?\d+)/)
        if (m) {
          if (m[1] === 'cp') lastEvalScore = parseInt(m[2]) / 100
          else lastEvalScore = parseInt(m[2]) > 0 ? 99 : -99
        }
      }

      if (msg.startsWith('bestmove')) {
        const parts = msg.split(/\s+/)
        const moveStr = parts[1]
        if (currentBestMoveResolver) {
          const r = currentBestMoveResolver
          currentBestMoveResolver = null
          if (!moveStr || moveStr === '(none)' || moveStr === '0000') {
            r(null)
          } else {
            r({
              from: moveStr.slice(0, 2),
              to: moveStr.slice(2, 4),
              promotion: moveStr.length > 4 ? moveStr[4] : undefined,
            })
          }
        }
        if (currentEvalResolver) {
          const r = currentEvalResolver
          currentEvalResolver = null
          r(lastEvalScore ?? 0)
        }
      }
    }

    worker.postMessage('uci')
  })

  return initPromise
}

export function isEngineReady(): boolean {
  return isReady
}

export async function getBestMove(
  fen: string,
  difficulty: Difficulty = 3
): Promise<{ from: string; to: string; promotion?: string } | null> {
  await initEngine()

  // Engine not available — heuristic fallback
  if (!isReady || !worker) {
    return heuristicMove(fen, difficulty)
  }

  const settings = DIFFICULTY_SETTINGS[difficulty]

  return new Promise((resolve) => {
    // Cancel any in-flight request
    if (currentBestMoveResolver) {
      try { worker?.postMessage('stop') } catch { /* ignore */ }
      const old = currentBestMoveResolver
      currentBestMoveResolver = null
      old(null)
    }
    currentBestMoveResolver = resolve
    lastEvalScore = null
    worker!.postMessage(`setoption name Skill Level value ${settings.skill}`)
    worker!.postMessage(`position fen ${fen}`)
    worker!.postMessage(`go depth ${settings.depth} movetime ${settings.movetimeMs}`)

    // Safety net
    setTimeout(() => {
      if (currentBestMoveResolver === resolve) {
        currentBestMoveResolver = null
        // Last-ditch fallback
        heuristicMove(fen, difficulty).then(resolve)
      }
    }, settings.movetimeMs + 5000)
  })
}

/**
 * Analyze a single position. Returns centipawn score from white's perspective.
 */
export async function evaluatePosition(fen: string, depth = 14): Promise<number> {
  await initEngine()
  if (!isReady || !worker) {
    return heuristicEval(fen)
  }

  return new Promise((resolve) => {
    if (currentEvalResolver) {
      const old = currentEvalResolver
      currentEvalResolver = null
      old(0)
    }
    currentEvalResolver = resolve
    lastEvalScore = null
    worker!.postMessage(`position fen ${fen}`)
    worker!.postMessage(`go depth ${depth}`)

    setTimeout(() => {
      if (currentEvalResolver === resolve) {
        currentEvalResolver = null
        resolve(lastEvalScore ?? heuristicEval(fen))
      }
    }, 6000)
  })
}

// ─── HEURISTIC FALLBACK ──────────────────────────────────────────────────
// Used when Stockfish fails to load. Uses material + center control + check.
// Stronger than random — beats most beginners.

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0,
}

function heuristicEval(fen: string): number {
  try {
    const c = new Chess(fen)
    if (c.isCheckmate()) return c.turn() === 'w' ? -99 : 99
    if (c.isDraw()) return 0
    let score = 0
    const board = c.board()
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f]
        if (!p) continue
        const v = PIECE_VALUES[p.type] ?? 0
        score += p.color === 'w' ? v : -v
        // Slight bonus for central pieces
        if ((r === 3 || r === 4) && (f === 3 || f === 4)) {
          score += p.color === 'w' ? 0.15 : -0.15
        }
      }
    }
    return score
  } catch {
    return 0
  }
}

async function heuristicMove(
  fen: string,
  difficulty: Difficulty
): Promise<{ from: string; to: string; promotion?: string } | null> {
  try {
    const c = new Chess(fen)
    const moves = c.moves({ verbose: true })
    if (moves.length === 0) return null

    // Difficulty 1: random
    if (difficulty === 1) {
      const m = moves[Math.floor(Math.random() * moves.length)]
      return { from: m.from, to: m.to, promotion: m.promotion }
    }

    // Score every move: 1-ply minimax with material + simple bonuses
    const turn = c.turn()
    const scored = moves.map((m) => {
      c.move(m)
      const evalScore = heuristicEval(c.fen())
      let score = turn === 'w' ? evalScore : -evalScore
      if (m.captured) score += PIECE_VALUES[m.captured] * 0.5
      if (m.san.includes('+')) score += 0.3
      if (m.san.includes('#')) score += 99
      if (m.flags.includes('p')) score += 5 // promotion
      c.undo()
      return { move: m, score }
    })

    scored.sort((a, b) => b.score - a.score)

    // Difficulty 2-3: pick from top 30% with some randomness
    // Difficulty 4-5: pick best
    const topPct = difficulty === 2 ? 0.5 : difficulty === 3 ? 0.3 : 0.1
    const topN = Math.max(1, Math.ceil(scored.length * topPct))
    const pick = scored[Math.floor(Math.random() * topN)].move

    return { from: pick.from, to: pick.to, promotion: pick.promotion }
  } catch {
    return null
  }
}

// Keep init eager so first move is fast
if (typeof window !== 'undefined') {
  setTimeout(() => initEngine(), 100)
}
