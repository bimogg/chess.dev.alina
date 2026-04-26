import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function squareToPos(square: string): [number, number, number] {
  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]) - 1
  return [file - 3.5, 0, (7 - rank) - 3.5]
}

export function LegalMoveMarker({ square, hasPiece }: { square: string; hasPiece: boolean }) {
  const [px, , pz] = squareToPos(square)
  if (hasPiece) {
    return (
      <mesh position={[px, 0.02, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.46, 32]} />
        <meshBasicMaterial color="#3cff6a" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
    )
  }
  return (
    <mesh position={[px, 0.02, pz]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.16, 24]} />
      <meshBasicMaterial color="#3cff6a" transparent opacity={0.65} />
    </mesh>
  )
}

export function SelectedMarker({ square }: { square: string }) {
  const [px, , pz] = squareToPos(square)
  return (
    <mesh position={[px, 0.01, pz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.97, 0.97]} />
      <meshBasicMaterial color="#f9f26a" transparent opacity={0.42} />
    </mesh>
  )
}

export function LastMoveMarker({ square }: { square: string }) {
  const [px, , pz] = squareToPos(square)
  return (
    <mesh position={[px, 0.01, pz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.97, 0.97]} />
      <meshBasicMaterial color="#d4c84a" transparent opacity={0.32} />
    </mesh>
  )
}

export function CheckMarker({ square }: { square: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.32 + 0.28 * Math.sin(clock.getElapsedTime() * 4)
    }
  })
  const [px, , pz] = squareToPos(square)
  return (
    <mesh ref={ref} position={[px, 0.01, pz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.97, 0.97]} />
      <meshBasicMaterial color="#ff3333" transparent opacity={0.45} />
    </mesh>
  )
}

export function HintMarker({ square }: { square: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.28 + 0.22 * Math.sin(clock.getElapsedTime() * 3)
    }
  })
  const [px, , pz] = squareToPos(square)
  return (
    <mesh ref={ref} position={[px, 0.015, pz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.97, 0.97]} />
      <meshBasicMaterial color="#44aaff" transparent opacity={0.38} />
    </mesh>
  )
}
