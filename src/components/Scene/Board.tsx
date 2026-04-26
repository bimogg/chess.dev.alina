import { useMemo } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { BoardTheme } from '../../types'
import { LegalMoveMarker, SelectedMarker, LastMoveMarker, CheckMarker, HintMarker } from './Markers'

const THEME_COLORS: Record<BoardTheme, { light: string; dark: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  green:   { light: '#eeeed2', dark: '#769656' },
  walnut:  { light: '#f0c68a', dark: '#8b5633' },
  ice:     { light: '#e3f2fd', dark: '#5d8aa8' },
  crimson: { light: '#fce4ec', dark: '#c2185b' },
}

// Border: height=0.12, center Y=-0.065 → top face at Y=-0.065+0.06=-0.005
// Square planes: Y=0.001 → safely above border top face (gap = 0.006)
// This eliminates Z-fighting between the border and the squares.
const BORDER_Y  = -0.065
const BORDER_H  = 0.13
const SQUARE_Y  = 0.001   // above border top face
const BORDER_MAT = new THREE.MeshStandardMaterial({
  color: '#2a1505',
  roughness: 0.85,
  metalness: 0,
})

const FILES = 'abcdefgh'
const RANKS = '12345678'

function squareToPos(square: string): [number, number, number] {
  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]) - 1
  return [file - 3.5, SQUARE_Y, (7 - rank) - 3.5]
}

export function ChessBoard() {
  const {
    selectSquare, selectedSquare, legalMoveSquares, lastMove,
    gameStatus, chess, boardTheme, hintSquare, hintToSquare,
  } = useGameStore()

  const { light: lightColor, dark: darkColor } = THEME_COLORS[boardTheme] ?? THEME_COLORS.classic

  const lightMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: lightColor, roughness: 0.55, metalness: 0 }),
    [lightColor]
  )
  const darkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.60, metalness: 0 }),
    [darkColor]
  )

  // King in check
  let checkedKingSquare: string | null = null
  if (gameStatus === 'check' || gameStatus === 'checkmate') {
    const board = chess.board()
    const turn  = chess.turn()
    outer: for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f]
        if (p && p.type === 'k' && p.color === turn) {
          checkedKingSquare = FILES[f] + RANKS[7 - r]
          break outer
        }
      }
    }
  }

  const occupiedSquares = useMemo(() => {
    const s = new Set<string>()
    chess.board().forEach((row, r) =>
      row.forEach((piece, f) => {
        if (piece) s.add(FILES[f] + RANKS[7 - r])
      })
    )
    return s
  }, [chess])

  // Build square meshes — stable keys, recreate only when theme or handler changes
  const squares = useMemo(() => {
    const els: JSX.Element[] = []
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const square  = FILES[f] + RANKS[7 - r]
        const isLight = (r + f) % 2 === 0
        const [px, py, pz] = squareToPos(square)
        els.push(
          <mesh
            key={square}
            position={[px, py, pz]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={e => { e.stopPropagation(); selectSquare(square) }}
          >
            <planeGeometry args={[1, 1]} />
            <primitive object={isLight ? lightMat : darkMat} />
          </mesh>
        )
      }
    }
    return els
  }, [lightMat, darkMat, selectSquare])

  return (
    <group>
      {/* Board border — top face at Y≈-0.005, well below SQUARE_Y=0.001 */}
      <mesh position={[0, BORDER_Y, 0]} receiveShadow>
        <boxGeometry args={[9.4, BORDER_H, 9.4]} />
        <primitive object={BORDER_MAT} />
      </mesh>

      {/* 64 squares */}
      {squares}

      {/* Markers — all Y values in Markers.tsx are ≥0.01, above SQUARE_Y */}
      {selectedSquare && <SelectedMarker square={selectedSquare} />}
      {lastMove && <LastMoveMarker square={lastMove.from} />}
      {lastMove && <LastMoveMarker square={lastMove.to} />}
      {checkedKingSquare && <CheckMarker square={checkedKingSquare} />}
      {legalMoveSquares.map(sq => (
        <LegalMoveMarker key={sq} square={sq} hasPiece={occupiedSquares.has(sq)} />
      ))}
      {hintSquare    && <HintMarker square={hintSquare} />}
      {hintToSquare  && <HintMarker square={hintToSquare} />}
    </group>
  )
}
