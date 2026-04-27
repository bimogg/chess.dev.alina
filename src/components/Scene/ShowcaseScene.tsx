import { useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { ChessPiece } from './Piece'
import type { PieceType, PieceColor } from '../../types/index'

// Module-level materials — never shared with Board.tsx (different module scope)
const BORDER_MAT = new THREE.MeshStandardMaterial({ color: '#1a0e04', roughness: 0.88, metalness: 0 })
const LIGHT_MAT  = new THREE.MeshStandardMaterial({ color: '#f0d9b5', roughness: 0.50, metalness: 0 })
const DARK_MAT   = new THREE.MeshStandardMaterial({ color: '#b58863', roughness: 0.62, metalness: 0 })

const BORDER_Y = -0.065
const BORDER_H = 0.13
const SQUARE_Y = 0.001
const FILES = 'abcdefgh'
const RANKS = '12345678'

function squareToPos(sq: string): [number, number, number] {
  const file = sq.charCodeAt(0) - 97
  const rank = parseInt(sq[1]) - 1
  return [file - 3.5, SQUARE_Y, (7 - rank) - 3.5]
}

const STARTING: Array<{ type: PieceType; color: PieceColor; square: string }> = [
  // Black back rank
  { type: 'r', color: 'b', square: 'a8' }, { type: 'n', color: 'b', square: 'b8' },
  { type: 'b', color: 'b', square: 'c8' }, { type: 'q', color: 'b', square: 'd8' },
  { type: 'k', color: 'b', square: 'e8' }, { type: 'b', color: 'b', square: 'f8' },
  { type: 'n', color: 'b', square: 'g8' }, { type: 'r', color: 'b', square: 'h8' },
  // Black pawns
  ...(['a','b','c','d','e','f','g','h'] as const).map(f => ({
    type: 'p' as PieceType, color: 'b' as PieceColor, square: f + '7',
  })),
  // White pawns
  ...(['a','b','c','d','e','f','g','h'] as const).map(f => ({
    type: 'p' as PieceType, color: 'w' as PieceColor, square: f + '2',
  })),
  // White back rank
  { type: 'r', color: 'w', square: 'a1' }, { type: 'n', color: 'w', square: 'b1' },
  { type: 'b', color: 'w', square: 'c1' }, { type: 'q', color: 'w', square: 'd1' },
  { type: 'k', color: 'w', square: 'e1' }, { type: 'b', color: 'w', square: 'f1' },
  { type: 'n', color: 'w', square: 'g1' }, { type: 'r', color: 'w', square: 'h1' },
]

function ShowcaseBoardMesh() {
  const squares = useMemo(() => {
    const els: JSX.Element[] = []
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = FILES[f] + RANKS[7 - r]
        const isLight = (r + f) % 2 === 0
        const [px, py, pz] = squareToPos(sq)
        els.push(
          <mesh key={sq} position={[px, py, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1, 1]} />
            <primitive object={isLight ? LIGHT_MAT : DARK_MAT} />
          </mesh>
        )
      }
    }
    return els
  }, [])

  return (
    <group>
      <mesh position={[0, BORDER_Y, 0]} receiveShadow>
        <boxGeometry args={[9.4, BORDER_H, 9.4]} />
        <primitive object={BORDER_MAT} />
      </mesh>
      {squares}
    </group>
  )
}

/**
 * Slowly rotates the board around the Y axis. Always on — never pauses,
 * the rotation is subtle enough to be calming, not distracting.
 */
function RotatingBoard() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (!groupRef.current) return
    // ~9°/sec — premium-feeling slow drift
    groupRef.current.rotation.y += delta * 0.16
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <ShowcaseBoardMesh />
      {STARTING.map(p => (
        <ChessPiece
          key={`${p.square}_${p.type}_${p.color}`}
          pieceType={p.type}
          color={p.color}
          square={p.square}
          isSelected={false}
          isLegalTarget={false}
          isLastMove={false}
          focusMode={false}
          onClick={() => {}}
        />
      ))}
    </group>
  )
}

export function ShowcaseScene() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        // Closer camera + slightly wider FOV → board reads BIG on the right
        // half of a full-width Canvas. Look-target is offset left so the
        // board (rotating around its Y axis at world origin) sits on the
        // right side of the viewport, away from the text column.
        camera={{ position: [-2, 8.5, 11], fov: 44, near: 0.5, far: 120 }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
          powerPreference: 'high-performance',
        }}
        // Force fully transparent WebGL clear AND null scene.background.
        // Guarantees the page gradient shows through with no seam.
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          gl.setClearAlpha(0)
          scene.background = null
        }}
        style={{ background: 'transparent', backgroundColor: 'transparent' }}
      >
        {/* Warm ambient base — gives the scene a wood/beige tint and lifts
            black pieces off the dark page background */}
        <ambientLight intensity={1.8} color="#fff2dd" />

        {/* Key warm light + shadows */}
        <directionalLight
          position={[3, 14, 7]}
          intensity={2.1}
          color="#fff0d4"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0003}
        />
        {/* Front fill — explicitly lights the front face of black pieces */}
        <directionalLight position={[0, 4, 14]} intensity={1.6} color="#ffe4c4" />
        {/* Cool back-rim — separates pieces from background */}
        <directionalLight position={[-6, 6, -4]} intensity={0.85} color="#cfd8dc" />
        {/* Subtle red kicker — ties scene into page palette */}
        <pointLight position={[-7, 5, 2]} intensity={0.35} color="#c1392b" />
        <pointLight position={[0, 9, 3]} intensity={0.45} color="#fff6e8" />

        <Suspense fallback={null}>
          <RotatingBoard />
          {/* Floor shadow follows the (rotating) board — anchors it visually */}
          <ContactShadows
            position={[0, -0.2, 0]}
            opacity={0.7}
            scale={16}
            blur={2.6}
            far={0.18}
            color="#1a0e04"
          />
        </Suspense>

        <OrbitControls
          // Look-at point shifted LEFT so the board (at world origin) appears
          // on the RIGHT half of the canvas, away from the text column.
          target={[-3.2, 0, 0]}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.1}
          enablePan={false}
          enableZoom={false}
          // User can drag the board with the cursor. Auto-rotation of the
          // board group continues in parallel via useFrame.
          enableRotate
          rotateSpeed={0.5}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
