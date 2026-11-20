import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

/**
 * EngineTestScene — temporary rotating mesh used to prove the 3D engine,
 * render loop, camera and lighting are wired up. Replaced by real content
 * (planets, spacecraft, etc.) in later tasks.
 *
 * Rotation is driven through R3F's `useFrame` and scaled by `delta`, so motion
 * stays smooth and frame-rate independent.
 */
export function EngineTestScene() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.x += delta * 0.35
    mesh.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#3fa7c7"
        flatShading
        metalness={0.2}
        roughness={0.45}
      />
    </mesh>
  )
}
