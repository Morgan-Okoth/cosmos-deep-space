import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

type SceneCanvasProps = {
  children?: ReactNode
  /** Camera world-space position. Default [0, 0, 6]. */
  cameraPosition?: [number, number, number]
}

/**
 * SceneCanvas — reusable React Three Fiber entry point.
 *
 * Owns the WebGL renderer, a default PerspectiveCamera (position, FOV, near/far
 * via the `camera` prop) and a minimal light rig (ambient + directional). Scene
 * content is supplied as `children` so the same shell can be reused across
 * later tasks.
 *
 * Uses a solid deep-space clear color (#04060a) so the WebGL renderer owns the
 * background — the 3D starfield lives inside the scene rather than relying on a
 * CSS fallback. Far plane is extended to 1000 to accommodate the star sphere
 * (radius 450).
 */
export function SceneCanvas({
  children,
  cameraPosition = [0, 0, 6],
}: SceneCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      camera={{
        position: cameraPosition,
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Deep-space background color owned by the renderer */}
      <color attach="background" args={['#04060a']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.1} />
      {children}
    </Canvas>
  )
}
