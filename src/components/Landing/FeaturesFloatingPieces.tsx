import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const MAT_SURFACE = '#111317'

type ControlState = { x: number; y: number }

function RightFeaturePiece({
  rotationPaused,
  controlRef,
}: {
  rotationPaused: boolean
  controlRef: React.MutableRefObject<ControlState>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const spinAccum = useRef(0.12)
  const { scene } = useGLTF('/models/pieces/white_knight.glb')
  const shadowTexture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5)
    g.addColorStop(0, 'rgba(0,0,0,0.55)')
    g.addColorStop(0.55, 'rgba(0,0,0,0.22)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }, [])

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: MAT_SURFACE,
        metalness: 0.68,
        roughness: 0.27,
        clearcoat: 1,
        clearcoatRoughness: 0.09,
        reflectivity: 0.82,
        envMapIntensity: 1.14,
      }),
    []
  )

  useEffect(
    () => () => {
      mat.dispose()
      shadowTexture?.dispose()
    },
    [mat, shadowTexture]
  )

  const root = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(ch => {
      const mesh = ch as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = mat
        mesh.castShadow = false
        mesh.receiveShadow = false
      }
    })
    const box = new THREE.Box3().setFromObject(c)
    if (box.isEmpty()) return c
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const norm = 2.9 / Math.max(size.x, size.y, size.z, 0.001)
    c.scale.setScalar(norm)
    c.position.set(-center.x * norm, -center.y * norm, -center.z * norm)
    return c
  }, [scene, mat])

  useFrame(({ clock }, dt) => {
    const g = groupRef.current
    const shadow = shadowRef.current
    if (!g || !shadow) return

    const safeDt = dt > 0 && dt < 0.14 ? dt : 1 / 60
    const t = clock.elapsedTime

    const controlX = THREE.MathUtils.lerp(g.rotation.x - 0.16, controlRef.current.y * 0.12, safeDt * 5.5)
    const controlY = THREE.MathUtils.lerp(g.rotation.y - spinAccum.current, controlRef.current.x * 0.38, safeDt * 5.5)
    const controlZ = THREE.MathUtils.lerp(g.rotation.z + 0.2, controlRef.current.x * -0.08, safeDt * 5.5)

    if (rotationPaused) {
      g.rotation.set(0.16 + controlX, 0.3 + controlY, -0.2 + controlZ)
      g.position.set(0.04, -0.28, 0.22)
      shadow.position.set(0.14, -1.46, 0.08)
      return
    }

    spinAccum.current += safeDt * 0.055
    g.rotation.x = 0.16 + controlX
    g.rotation.y = spinAccum.current + controlY
    g.rotation.z = -0.2 + controlZ
    g.position.set(0.04, -0.28, 0.22)
    shadow.position.set(0.14, -1.46, 0.08)
    shadow.scale.set(1.12 + Math.sin(t * 0.38) * 0.02, 0.78 + Math.cos(t * 0.38) * 0.01, 1)
  })

  return (
    <>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 2.3]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.24}
          depthWrite={false}
          map={shadowTexture ?? undefined}
        />
      </mesh>
      <group ref={groupRef}>
        <primitive object={root} />
      </group>
    </>
  )
}

export function FeaturesFloatingPieces() {
  const [rotationPaused, setRotationPaused] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  const [showCanvas, setShowCanvas] = useState(true)
  const controlRef = useRef<ControlState>({ x: 0, y: 0 })
  const floatRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setRotationPaused(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 679px)')
    const apply = () => setShowCanvas(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = floatRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (!inside) {
        controlRef.current.x *= 0.92
        controlRef.current.y *= 0.92
        return
      }

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
      controlRef.current.x = THREE.MathUtils.clamp(nx, -1, 1)
      controlRef.current.y = THREE.MathUtils.clamp(ny, -1, 1)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  if (!showCanvas) return null

  const resetControl = () => {
    controlRef.current.x = 0
    controlRef.current.y = 0
  }

  return (
    <div
      ref={floatRef}
      className="lp-feats-float"
      onPointerLeave={resetControl}
      onPointerUp={resetControl}
      onPointerCancel={resetControl}
      role="presentation"
    >
      <Canvas
        camera={{ position: [0, 0.08, 7.2], fov: 34, near: 0.1, far: 50 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          gl.setClearAlpha(0)
          scene.background = null
          scene.environment = null
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <hemisphereLight args={['#f7f8fa', '#20242a', 0.42]} />
        {/* Key light: soft front-right highlight */}
        <directionalLight position={[5.8, 6.2, 5.2]} intensity={1.22} color="#ffffff" />
        {/* Fill light: low-level lift on shadow side */}
        <directionalLight position={[-4.4, 2.8, 3.6]} intensity={0.42} color="#dbe4ef" />
        {/* Rim light: rear edge definition for silhouette */}
        <directionalLight position={[1.6, 4.4, -6.2]} intensity={0.82} color="#f5f8ff" />

        <Suspense fallback={null}>
          <RightFeaturePiece rotationPaused={rotationPaused} controlRef={controlRef} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/pieces/white_knight.glb')
