import { useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { ChessPiece } from './Piece'
import type { PieceType, PieceColor } from '../../types/index'

// Module-level materials — never shared with Board.tsx (different module scope)
const BORDER_MAT = new THREE.MeshStandardMaterial({ color: '#121419', roughness: 0.88, metalness: 0 })
const LIGHT_MAT  = new THREE.MeshStandardMaterial({ color: '#eff2f5', roughness: 0.50, metalness: 0 })
const DARK_MAT   = new THREE.MeshStandardMaterial({ color: '#2d3238', roughness: 0.62, metalness: 0 })

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

function ShowcaseBoard() {
  // Tilted slightly clockwise — Webshocker-style 3D product shot
  // Raised slightly so the bottom/front edge clears the framebuffer (no bottom crop).
  return (
    <group position={[0, 0.37, 0]} rotation={[0, -0.32, 0]} scale={[0.97, 0.97, 0.97]}>
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
        // Webshocker-style hero camera: high tilt, board centered horizontally,
        // black pieces in front-left, white in back-right. Lower fov tightens
        // the framing so the board fills the canvas dramatically.
        // Camera pulled back slightly so the full board edge stays in view.
        camera={{ position: [0, 7.68, 13.08], fov: 32, near: 0.3, far: 140 }}
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
        {/* Soft studio light setup */}
        <ambientLight intensity={1.0} color="#f5f7fa" />

        {/* Key warm light + shadows */}
        <directionalLight
          position={[-2, 11, -5]}
          intensity={1.45}
          color="#f8f9fb"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.0003}
        />
        {/* Front fill — explicitly lights the front face of black pieces */}
        <directionalLight position={[3, 5, 9]} intensity={0.82} color="#ffffff" />
        <directionalLight position={[-8, 4, -8]} intensity={0.52} color="#d5dde6" />
        <pointLight position={[-5, 3, -1]} intensity={0.08} color="#c1392b" />
        <pointLight position={[0, 8, 3]} intensity={0.38} color="#ffffff" />

        <Suspense fallback={null}>
          <ShowcaseBoard />
          {/* Floor shadow follows the (rotating) board — anchors it visually */}
          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.42}
            scale={15}
            blur={2.4}
            far={0.18}
            color="#13161b"
          />
        </Suspense>

        <OrbitControls
          target={[0, 0.26, 0]}
          minPolarAngle={0.58}
          maxPolarAngle={Math.PI / 2.45}
          enablePan={false}
          enableZoom={false}
          // User can drag the board with the cursor. Auto-rotation of the
          // board group continues in parallel via useFrame.
          enableRotate
          rotateSpeed={0.26}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
