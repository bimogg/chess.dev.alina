#!/usr/bin/env node
/**
 * Copy the Stockfish engine files from node_modules into /public/stockfish/
 * so the browser can load them as a Web Worker at /stockfish/stockfish.js.
 * Runs automatically after `npm install`.
 *
 * Supports stockfish v16 (src/) and v18+ (bin/) layouts.
 * Defaults to the lite-single variant — single-threaded, smaller wasm,
 * works in any browser without SharedArrayBuffer / cross-origin isolation.
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PKG  = join(ROOT, 'node_modules', 'stockfish')
const OUT  = join(ROOT, 'public', 'stockfish')

const FALLBACK_WORKER = `// Stockfish placeholder — engine files were not found.
// Run \`npm install\` to install Stockfish.
self.onmessage = function() { /* ignore — wrapper falls back to heuristic AI */ };
`

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

function findSourceDir() {
  // v18+ uses bin/, v16 used src/
  const bin = join(PKG, 'bin')
  const src = join(PKG, 'src')
  if (existsSync(bin)) return bin
  if (existsSync(src)) return src
  return null
}

function pickPrimary(files) {
  // Prefer "lite-single" → no SharedArrayBuffer, smaller, works everywhere.
  // Fall back to "single", then "lite", then any .js.
  const matchers = [
    /lite.*single.*\.js$/,
    /single.*lite.*\.js$/,
    /single.*\.js$/,
    /lite.*\.js$/,
    /^stockfish.*\.js$/,
  ]
  for (const re of matchers) {
    const m = files.find((f) => re.test(f) && !f.endsWith('.wasm') && !f.includes('asm'))
    if (m) return m
  }
  return files.find((f) => f.endsWith('.js')) ?? null
}

function pickWasmFor(primaryJs, files) {
  if (!primaryJs) return null
  // Typical pair: stockfish-18-lite-single.js -> stockfish-18-lite-single.wasm
  const sameStem = primaryJs.replace(/\.js$/, '.wasm')
  if (files.includes(sameStem)) return sameStem
  // Fallback to any wasm in copied set.
  return files.find((f) => f.endsWith('.wasm')) ?? null
}

function copyAll() {
  ensureDir(OUT)

  const SRC = findSourceDir()
  if (!SRC) {
    console.warn('[copy-stockfish] node_modules/stockfish not found — installing fallback')
    writeFileSync(join(OUT, 'stockfish.js'), FALLBACK_WORKER)
    return
  }

  const allFiles = readdirSync(SRC)

  // Only copy the lite-single variant (~7 MB) — keeps deployment small.
  // The full builds are >100 MB and need SharedArrayBuffer to actually run.
  const wantedPattern = /^stockfish.*lite.*single.*\.(js|wasm|worker\.js)$/
  const files = allFiles.filter((f) => wantedPattern.test(f))
  const toCopy = files.length > 0 ? files : allFiles.filter((f) => /\.(js|wasm)$/.test(f) && !f.includes('asm'))

  for (const f of toCopy) {
    const full = join(SRC, f)
    try {
      if (!statSync(full).isFile()) continue
      copyFileSync(full, join(OUT, f))
    } catch (e) {
      console.warn(`[copy-stockfish] Skipping ${f}: ${e.message}`)
    }
  }

  const primary = pickPrimary(toCopy)
  if (primary) {
    if (primary !== 'stockfish.js') {
      // Importer shim. Browsers will resolve relative paths from /stockfish/.
      const shim = `// Auto-generated entry. Loads the chosen Stockfish variant.
// Source: ${primary}
self.importScripts('./${primary}');
`
      writeFileSync(join(OUT, 'stockfish.js'), shim)
      console.log(`[copy-stockfish] /stockfish/stockfish.js → loads ${primary}`)
    } else {
      console.log('[copy-stockfish] /stockfish/stockfish.js ready')
    }

    // Most stockfish js builds look up "stockfish.wasm" by default.
    // Provide a stable alias so runtime wasm lookup never 404s.
    const primaryWasm = pickWasmFor(primary, toCopy)
    if (primaryWasm && primaryWasm !== 'stockfish.wasm') {
      copyFileSync(join(SRC, primaryWasm), join(OUT, 'stockfish.wasm'))
      console.log(`[copy-stockfish] /stockfish/stockfish.wasm -> copied from ${primaryWasm}`)
    }
  } else {
    console.warn('[copy-stockfish] No suitable Stockfish .js found — installing fallback')
    writeFileSync(join(OUT, 'stockfish.js'), FALLBACK_WORKER)
  }
}

try {
  copyAll()
} catch (e) {
  console.error('[copy-stockfish] Failed:', e.message)
  ensureDir(OUT)
  writeFileSync(join(OUT, 'stockfish.js'), FALLBACK_WORKER)
}
