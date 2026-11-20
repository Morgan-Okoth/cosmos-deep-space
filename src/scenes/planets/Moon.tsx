import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { SphereGeometry, ShaderMaterial, Mesh, Vector3 } from 'three'
import { MOON_VERT, MOON_FRAG } from './shaders/moonSurface'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type MoonProps = {
  /**
   * Sphere radius in world units.
   * @default 0.5
   */
  radius?: number

  /**
   * Axial rotation speed in radians per second.
   * @default 0.015
   */
  rotationSpeed?: number

  /** Shared light direction from the scene (should match the directional light). */
  lightDir: Vector3
}

// ---------------------------------------------------------------------------
// Moon
// ---------------------------------------------------------------------------

/**
 * Moon — a reusable rocky moon component.
 *
 * Uses a custom ShaderMaterial running 4-octave FBM to produce a varied grey
 * surface with crater-basin-like darker regions.  Lit by the same directional
 * light as the parent planet for visual consistency.
 *
 * Position is controlled by the parent group/OrbitalSystem — this component
 * always renders at [0,0,0] relative to whatever group contains it.
 */
export function Moon({
  radius        = 0.5,
  rotationSpeed = 0.015,
  lightDir,
}: MoonProps) {
  const meshRef = useRef<Mesh>(null)

  const geometry = useMemo(() => new SphereGeometry(radius, 64, 32), [radius])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   MOON_VERT,
        fragmentShader: MOON_FRAG,
        uniforms: {
          uLightDir:  { value: lightDir },
          // uCameraPos is updated each frame from the R3F camera
          uCameraPos: { value: new Vector3() },
        },
      }),
    // lightDir reference is stable (created once in OrbitalSystem)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radius],
  )

  useFrame(({ camera }, delta) => {
    if (!meshRef.current) return
    // Axial rotation — tidal-lock would be rotationSpeed ≈ orbit speed;
    // we keep it configurable for visual interest
    meshRef.current.rotation.y += rotationSpeed * delta
    // Update camera position uniform for specular-free lighting calc
    ;(meshRef.current.material as ShaderMaterial).uniforms.uCameraPos.value.copy(
      camera.position,
    )
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}
