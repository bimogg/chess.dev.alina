import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { ChessBoard } from './Board'
import { ChessPiece } from './Piece'
import { useGameStore } from '../../store/gameStore'

const FILES = 'abcdefgh'
const RANKS = '12345678'

function Pieces() {
  const {
    chess, selectedSquare, legalMoveSquares,
    lastMove, focusMode, selectSquare,
  } = useGameStore()

  const board         = chess.board()
  const legalSet      = new Set(legalMoveSquares)
  const lastMoveSet   = new Set(lastMove ? [lastMove.from, lastMove.to] : [])

  const pieces: JSX.Element[] = []
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f]
      if (!piece) continue
      const square = FILES[f] + RANKS[7 - r]
      pieces.push(
        <ChessPiece
          key={`${square}_${piece.type}_${piece.color}`}
          pieceType={piece.type as 'k' | 'q' | 'r' | 'b' | 'n' | 'p'}
          color={piece.color as 'w' | 'b'}
          square={square}
          isSelected={selectedSquare === square}
          isLegalTarget={legalSet.has(square)}
          isLastMove={lastMoveSet.has(square)}
          focusMode={focusMode}
          onClick={() => selectSquare(square)}
        />
      )
    }
  }
  return <>{pieces}</>
}

function Lights() {
  return (
    <>
      {/* Soft fill — keeps dark pieces visible */}
      <ambientLight intensity={0.9} />

      {/* Main key light — casts shadows */}
      <directionalLight
        position={[4, 10, 7]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0003}
      />

      {/* Soft rim from opposite side */}
      <directionalLight position={[-4, 6, -4]} intensity={0.4} />

      {/* Warm top fill */}
      <pointLight position={[0, 8, 0]} intensity={0.2} color="#fff6e0" />
    </>
  )
}

export function ChessScene() {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 9.5, 8.5], fov: 50, near: 0.5, far: 120 }}
        gl={{
          antialias: true,
          // logarithmicDepthBuffer eliminates any remaining Z-fighting
          // between the board border and square planes
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'linear-gradient(160deg, #0d1117 0%, #12181f 100%)' }}
      >
        <Lights />

        <Suspense fallback={null}>
          <ChessBoard />
          <Pieces />
          {/* ContactShadows must be BELOW the board geometry.
              Board border bottom ≈ Y = -0.065 - 0.065 = -0.13.
              Placing shadows at Y=-0.2 keeps them clear of all geometry. */}
          <ContactShadows
            position={[0, -0.2, 0]}
            opacity={0.45}
            scale={12}
            blur={2.2}
            far={0.15}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={7}
          maxDistance={20}
          enablePan={false}
          dampingFactor={0.07}
          enableDamping
        />
      </Canvas>

      <button
        onClick={() => controlsRef.current?.reset()}
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          background: 'rgba(13,17,23,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#8b949e',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          backdropFilter: 'blur(4px)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
      >
        ⟳ Reset Camera
      </button>
    </div>
  )
}
