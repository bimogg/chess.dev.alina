#!/usr/bin/env node
/**
 * Copy the Stockfish engine files from node_modules into /public/stockfish/
 * so the browser can load them as a Web Worker at /stockfish/stockfish.js.
 * Runs automatically after `npm install`.
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'node_modules', 'stockfish', 'src')
const OUT = join(ROOT, 'public', 'stockfish')

const FALLBACK_WORKER = `// Stockfish placeholder — engine files were not found in node_modules.
// Run \`npm install\` to install Stockfish, or download stockfish.js manually.
self.onmessage = function(e) {
  // Respond with engine-not-available so the wrapper falls back to heuristic AI.
  if (e.data === 'uci') {
    // Don't respond — the wrapper will time out and fall back.
  }
};
`

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

function copyAll() {
  ensureDir(OUT)

  if (!existsSync(SRC)) {
    console.warn('[copy-stockfish] node_modules/stockfish/src not found — installing fallback')
    writeFileSync(join(OUT, 'stockfish.js'), FALLBACK_WORKER)
    return
  }

  const files = readdirSync(SRC)
  let primary = null

  for (const f of files) {
    const full = join(SRC, f)
    if (!statSync(full).isFile()) continue
    copyFileSync(full, join(OUT, f))
    // Prefer the single-threaded NNUE build — works in any browser without
    // SharedArrayBuffer / cross-origin isolation requirements.
    if (!primary && /single.*\.js$/.test(f)) primary = f
  }

  if (!primary) {
    // Fallback to any .js file
    primary = files.find((f) => f.endsWith('.js')) ?? null
  }

  // Make /stockfish/stockfish.js the canonical entry, importing the chosen variant
  if (primary && primary !== 'stockfish.js') {
    const shim = `// Auto-generated entry. Imports the chosen Stockfish variant.\nimportScripts('./${primary}');\n`
    writeFileSync(join(OUT, 'stockfish.js'), shim)
    console.log(`[copy-stockfish] Stockfish ready → /stockfish/stockfish.js (loads ${primary})`)
  } else if (primary === 'stockfish.js') {
    console.log('[copy-stockfish] Stockfish ready → /stockfish/stockfish.js')
  } else {
    console.warn('[copy-stockfish] No Stockfish .js file found — installing fallback')
    writeFileSync(join(OUT, 'stockfish.js'), FALLBACK_WORKER)
  }
}

try {
  copyAll()
} catch (e) {
  console.error('[copy-stockfish] Failed:', e.message)
  // Don't break the install
  ensureDir(OUT)
  writeFileSync(join(OUT, 'stockfish.js'), FALLBACK_WORKER)
}
