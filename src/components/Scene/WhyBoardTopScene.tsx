import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { ChessPiece } from './Piece'
import * as THREE from 'three'

const BORDER_MAT = new THREE.MeshStandardMaterial({ color: '#151922', roughness: 0.84, metalness: 0.04 })
const LIGHT_MAT = new THREE.MeshStandardMaterial({ color: '#ece8e1', roughness: 0.5, metalness: 0.02 })
const DARK_MAT = new THREE.MeshStandardMaterial({ color: '#343942', roughness: 0.58, metalness: 0.02 })

const FILES = 'abcdefgh'
const RANKS = '12345678'

const STARTING: Array<{ type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p'; color: 'w' | 'b'; square: string }> = [
  { type: 'r', color: 'b', square: 'a8' }, { type: 'n', color: 'b', square: 'b8' },
  { type: 'b', color: 'b', square: 'c8' }, { type: 'q', color: 'b', square: 'd8' },
  { type: 'k', color: 'b', square: 'e8' }, { type: 'b', color: 'b', square: 'f8' },
  { type: 'n', color: 'b', square: 'g8' }, { type: 'r', color: 'b', square: 'h8' },
  ...(['a','b','c','d','e','f','g','h'] as const).map(f => ({ type: 'p' as const, color: 'b' as const, square: `${f}7` })),
  ...(['a','b','c','d','e','f','g','h'] as const).map(f => ({ type: 'p' as const, color: 'w' as const, square: `${f}2` })),
  { type: 'r', color: 'w', square: 'a1' }, { type: 'n', color: 'w', square: 'b1' },
  { type: 'b', color: 'w', square: 'c1' }, { type: 'q', color: 'w', square: 'd1' },
  { type: 'k', color: 'w', square: 'e1' }, { type: 'b', color: 'w', square: 'f1' },
  { type: 'n', color: 'w', square: 'g1' }, { type: 'r', color: 'w', square: 'h1' },
]

function squareToPos(sq: string): [number, number, number] {
  const file = sq.charCodeAt(0) - 97
  const rank = parseInt(sq[1]) - 1
  return [file - 3.5, 0.001, (7 - rank) - 3.5]
}

function WhyBoardMesh() {
  const squares = useMemo(() => {
    const els: JSX.Element[] = []
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = FILES[f] + RANKS[7 - r]
        const isLight = (r + f) % 2 === 0
        const [x, y, z] = squareToPos(sq)
        els.push(
          <mesh key={sq} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
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
      <mesh position={[0, -0.065, 0]}>
        <boxGeometry args={[9.4, 0.13, 9.4]} />
        <primitive object={BORDER_MAT} />
      </mesh>
      {squares}
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

export function WhyBoardTopScene() {
  return (
    <Canvas
      camera={{ position: [0, 10.4, 11.8], fov: 35, near: 0.1, far: 110 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.88} />
      <directionalLight position={[6, 14, 6]} intensity={1.05} color="#ffffff" />
      <directionalLight position={[-5, 8, -5]} intensity={0.34} color="#d9dfeb" />
      <Suspense fallback={null}>
        <group rotation={[0, -0.28, 0]} position={[0, -0.24, 0]} scale={[1.08, 1.08, 1.08]}>
          <WhyBoardMesh />
        </group>
      </Suspense>
    </Canvas>
  )
}
