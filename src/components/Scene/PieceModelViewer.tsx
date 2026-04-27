import { Suspense, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'

// ── Renders a single GLB piece, centred at world origin, white material ──
function PieceModel({ pieceKey }: { pieceKey: string }) {
  const { appTheme } = useGameStore()
  const url = `/models/pieces/white_${pieceKey}.glb`
  const { scene } = useGLTF(url)

  // Per-instance material — one per Canvas so WebGL contexts stay independent
  const mat = useMemo(() => {
    if (appTheme === 'light') {
      // Keep premium red tone, but preserve shape details via lights/highlights.
      return new THREE.MeshStandardMaterial({
        color: '#d3342a',
        roughness: 0.36,
        metalness: 0.12,
        emissive: '#2b0505',
        emissiveIntensity: 0.22,
      })
    }
    return new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.3,
      metalness: 0.1,
    })
  }, [appTheme])
  useEffect(() => () => { mat.dispose() }, [mat])

  const cloned = useMemo(() => {
    const c = scene.clone(true)

    c.traverse(child => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = mat
        mesh.castShadow = true
      }
    })

    // Normalise: scale so tallest dimension = 1.7 units, then centre at origin
    const box    = new THREE.Box3().setFromObject(c)
    if (box.isEmpty()) return c
    const size   = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s      = 1.7 / Math.max(size.x, size.y, size.z, 0.001)

    c.scale.setScalar(s)
    c.position.set(-center.x * s, -center.y * s, -center.z * s)
    return c
  }, [scene, mat])

  return <primitive object={cloned} />
}

// ── Public component — drop into any div; fills it via absolute positioning ──
export function PieceModelViewer({ pieceKey }: { pieceKey: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 3.2], fov: 36, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* Soft fill — keeps piece details readable in both themes */}
      <ambientLight intensity={0.72} />
      {/* Main key light */}
      <directionalLight position={[3, 7, 4]}  intensity={1.35} castShadow={false} />
      {/* Soft rim from the opposite side */}
      <directionalLight position={[-3, 3, -2]} intensity={0.55} />
      {/* Top specular kick so carvings/edges are visible */}
      <directionalLight position={[0, 5, 1]} intensity={0.42} />

      <Suspense fallback={null}>
        <PieceModel pieceKey={pieceKey} />
      </Suspense>

      <OrbitControls
        target={[0, 0, 0]}
        autoRotate
        autoRotateSpeed={1.4}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        dampingFactor={0.07}
        enableDamping
      />
    </Canvas>
  )
}

// Kick off preloads so models are ready when the section scrolls into view.
// white_*.glb files are already preloaded by Piece.tsx — this is a no-op if
// ShowcaseScene is on the same page, but kept here for standalone correctness.
;(['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'] as const).forEach(p =>
  useGLTF.preload(`/models/pieces/white_${p}.glb`)
)
