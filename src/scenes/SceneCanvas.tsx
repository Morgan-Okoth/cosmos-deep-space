import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

type SceneCanvasProps = {
  children?: ReactNode
}

/**
 * SceneCanvas — reusable React Three Fiber entry point.
 *
 * Owns the WebGL renderer, a default PerspectiveCamera (position, FOV, near/far
 * via the `camera` prop) and a minimal light rig (ambient + directional). Scene
 * content is supplied as `children` so the same shell can be reused across
 * later tasks.
 *
 * The canvas clears transparent (`alpha: true`) so the COSMOS CSS starfield
 * shows through behind the 3D content. Pixel ratio is capped at 2 and shadows
 * are left off to keep the scene lightweight.
 */
export function SceneCanvas({ children }: SceneCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      camera={{
        position: [0, 0, 6],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.1} />
      {children}
    </Canvas>
  )
}
