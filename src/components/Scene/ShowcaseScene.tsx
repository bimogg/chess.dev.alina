import { useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
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

function ShowcaseBoard() {
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

export function ShowcaseScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [-1.5, 10, 11], fov: 42, near: 0.5, far: 120 }}
      gl={{
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[3, 14, 7]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0003}
      />
      {/* Front fill — lifts black pieces off the dark background */}
      <directionalLight position={[0, 4, 14]} intensity={1.2} />
      <directionalLight position={[-5, 6, -4]} intensity={0.7} />
      <pointLight position={[0, 9, 3]} intensity={0.4} color="#fff6e8" />

      <Suspense fallback={null}>
        <ShowcaseBoard />
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
        <ContactShadows
          position={[0, -0.2, 0]}
          opacity={0.55}
          scale={14}
          blur={2.2}
          far={0.15}
        />
      </Suspense>

      <OrbitControls
        target={[0, 0, 0]}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={8}
        maxDistance={18}
        enablePan={false}
        enableZoom={false}
        dampingFactor={0.06}
        enableDamping
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  )
}
