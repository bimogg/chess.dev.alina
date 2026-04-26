import { useMemo, useEffect, Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { PieceType, PieceColor, PieceSkin } from '../../types'
import { PIECE_NAMES } from '../../utils/chess'
import { useGameStore } from '../../store/gameStore'

interface PieceProps {
  pieceType: PieceType
  color: PieceColor
  square: string
  isSelected: boolean
  isLegalTarget: boolean
  isLastMove: boolean
  focusMode: boolean
  onClick: () => void
}

// Per-skin material colors. Each skin defines white & black variants
// plus optional metallic / emissive overrides for special skins (gold, neon).
type SkinDef = {
  white: { color: string; metalness: number; roughness: number; emissive?: string; emissiveIntensity?: number }
  black: { color: string; metalness: number; roughness: number; emissive?: string; emissiveIntensity?: number }
}

const SKIN_DEFS: Record<PieceSkin, SkinDef> = {
  classic: {
    white: { color: '#ecdfc8', metalness: 0.06, roughness: 0.4 },
    black: { color: '#1c0e08', metalness: 0.06, roughness: 0.4 },
  },
  gold: {
    white: { color: '#fff2c4', metalness: 0.85, roughness: 0.18, emissive: '#3a2a00', emissiveIntensity: 0.15 },
    black: { color: '#b8860b', metalness: 0.95, roughness: 0.22, emissive: '#2a1c00', emissiveIntensity: 0.18 },
  },
  marble: {
    white: { color: '#f5f5f0', metalness: 0.05, roughness: 0.18 },
    black: { color: '#2c2c2c', metalness: 0.18, roughness: 0.22 },
  },
  neon: {
    white: { color: '#00ffe1', metalness: 0.4, roughness: 0.3, emissive: '#00bfa5', emissiveIntensity: 0.65 },
    black: { color: '#ff00aa', metalness: 0.4, roughness: 0.3, emissive: '#a3007a', emissiveIntensity: 0.6 },
  },
}

function squareToPos(square: string): [number, number, number] {
  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]) - 1
  return [file - 3.5, 0, (7 - rank) - 3.5]
}

function GLBPiece({
  pieceType, color, square,
  isSelected, isLegalTarget, isLastMove, focusMode,
  onClick,
}: PieceProps) {
  const skin = useGameStore(s => s.pieceSkin)
  const colorStr = color === 'w' ? 'white' : 'black'
  const url = `/models/pieces/${colorStr}_${PIECE_NAMES[pieceType]}.glb`
  const { scene } = useGLTF(url)

  const [px, , pz] = squareToPos(square)
  const dimmed = focusMode && !isSelected && !isLegalTarget && !isLastMove

  // Get skin colors
  const skinDef = SKIN_DEFS[skin] ?? SKIN_DEFS.classic
  const colorVariant = color === 'w' ? skinDef.white : skinDef.black

  // Per-instance material — recreated when skin changes (so all visuals update)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: colorVariant.color,
    roughness: colorVariant.roughness,
    metalness: colorVariant.metalness,
    emissive: colorVariant.emissive ?? '#000000',
    emissiveIntensity: colorVariant.emissiveIntensity ?? 0,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  }), [color, skin, colorVariant.color, colorVariant.roughness, colorVariant.metalness, colorVariant.emissive, colorVariant.emissiveIntensity])

  useEffect(() => () => { mat.dispose() }, [mat])

  useEffect(() => {
    mat.transparent = false
    mat.opacity = 1
    mat.depthWrite = true

    if (isSelected) {
      mat.color.set(color === 'w' ? '#f8f56a' : '#b8b800')
      mat.emissive.set(color === 'w' ? '#2a2a00' : '#1c1c00')
      mat.emissiveIntensity = 0.4
      mat.roughness = 0.22
    } else if (dimmed) {
      mat.color.set(color === 'w' ? '#6a6254' : '#241611')
      mat.emissive.set('#000000')
      mat.emissiveIntensity = 0
      mat.roughness = 0.55
    } else {
      mat.color.set(colorVariant.color)
      mat.emissive.set(colorVariant.emissive ?? '#000000')
      mat.emissiveIntensity = colorVariant.emissiveIntensity ?? 0
      mat.roughness = colorVariant.roughness
      mat.metalness = colorVariant.metalness
    }
    mat.needsUpdate = true
  }, [mat, color, isSelected, dimmed, colorVariant])

  const { clone, scaleVal, posOffset } = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(child => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = mat
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })

    const box = new THREE.Box3().setFromObject(c)
    if (box.isEmpty()) {
      return { clone: c, scaleVal: 1, posOffset: [0, 0, 0] as [number, number, number] }
    }

    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    const maxXZ  = Math.max(size.x, size.z, 0.001)
    const s      = 0.82 / maxXZ

    const posOffset: [number, number, number] = [
      -center.x * s,
      -box.min.y * s,
      -center.z * s,
    ]

    return { clone: c, scaleVal: s, posOffset }
  }, [scene, mat])

  return (
    <group position={[px, 0, pz]} onClick={e => { e.stopPropagation(); onClick() }}>
      <primitive object={clone} scale={scaleVal} position={posOffset} />
    </group>
  )
}

function FallbackPiece({
  pieceType, color, square, isSelected, onClick,
}: Pick<PieceProps, 'pieceType' | 'color' | 'square' | 'isSelected' | 'onClick'>) {
  const [px, , pz] = squareToPos(square)
  const col = color === 'w' ? '#ecdfc8' : '#1c0e08'
  const heights: Record<string, number> = { k: 0.55, q: 0.5, r: 0.35, b: 0.45, n: 0.4, p: 0.28 }
  const h = heights[pieceType] ?? 0.35
  const r = pieceType === 'p' ? 0.12 : 0.15
  return (
    <group position={[px, 0, pz]} onClick={e => { e.stopPropagation(); onClick() }}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 0.72, r, h, 12]} />
        <meshStandardMaterial
          color={col}
          emissive={isSelected ? '#333300' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
          roughness={0.4}
          transparent={false}
          opacity={1}
        />
      </mesh>
    </group>
  )
}

export function ChessPiece(props: PieceProps) {
  return (
    <Suspense fallback={<FallbackPiece {...props} />}>
      <GLBPiece {...props} />
    </Suspense>
  )
}

;(['white', 'black'] as const).forEach(c =>
  (['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'] as const).forEach(p =>
    useGLTF.preload(`/models/pieces/${c}_${p}.glb`)
  )
)
