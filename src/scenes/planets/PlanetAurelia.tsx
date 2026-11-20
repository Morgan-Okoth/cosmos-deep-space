import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  SphereGeometry,
  ShaderMaterial,
  BackSide,
  NormalBlending,
  AdditiveBlending,
  Mesh,
  Vector3,
} from 'three'
import { SURFACE_VERT, SURFACE_FRAG } from './shaders/planetSurface'
import { CLOUDS_VERT, CLOUDS_FRAG }   from './shaders/planetClouds'
import { ATMO_VERT, ATMO_FRAG }       from './shaders/planetAtmosphere'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type PlanetAureliaProps = {
  /**
   * Sphere radius in world units.
   * @default 2.2
   */
  radius?: number

  /**
   * Surface rotation speed in radians per second.
   * @default 0.04
   */
  rotationSpeed?: number

  /**
   * Cloud layer rotation speed (radians per second).
   * Typically slightly slower than the surface.
   * @default 0.028
   */
  cloudSpeed?: number

  /**
   * Atmosphere Fresnel rim intensity. 1 = default.
   * @default 1
   */
  atmosphereIntensity?: number

  /**
   * Cloud opacity multiplier (0–1).
   * @default 0.88
   */
  cloudOpacity?: number
}

// ---------------------------------------------------------------------------
// Shared light direction (matches SceneCanvas directionalLight [5,5,5])
// ---------------------------------------------------------------------------

const LIGHT_DIR = new Vector3(5, 5, 5).normalize()

// ---------------------------------------------------------------------------
// Geometry builder helpers
// ---------------------------------------------------------------------------

function makeSphere(radius: number, widthSeg: number, heightSeg: number) {
  return new SphereGeometry(radius, widthSeg, heightSeg)
}

// ---------------------------------------------------------------------------
// PlanetAurelia
// ---------------------------------------------------------------------------

/**
 * PlanetAurelia — procedural ocean planet rendered via three custom
 * ShaderMaterial layers:
 *
 *  1. Surface  — 5-octave FBM continent/ocean shader + Blinn-Phong lighting
 *  2. Clouds   — 4-octave FBM cloud patches on a slightly larger sphere,
 *                rotates independently of the surface
 *  3. Atmosphere — Fresnel rim on a BackSide sphere, additive blending
 *
 * All geometry is built once in useMemo.  useFrame mutates rotation values
 * and uniform time — no per-frame allocations.
 */
export function PlanetAurelia({
  radius              = 2.2,
  rotationSpeed       = 0.04,
  cloudSpeed          = 0.028,
  atmosphereIntensity = 1,
  cloudOpacity        = 0.88,
}: PlanetAureliaProps) {
  const surfaceRef = useRef<Mesh>(null)
  const cloudsRef  = useRef<Mesh>(null)

  // Pull the camera from the R3F context — needed for specular uniforms
  const { camera } = useThree()

  // ---- Geometry (built once) -----------------------------------------------
  const surfaceGeo = useMemo(() => makeSphere(radius, 128, 64), [radius])
  const cloudsGeo  = useMemo(() => makeSphere(radius * 1.012, 96, 48), [radius])
  const atmoGeo    = useMemo(() => makeSphere(radius * 1.065, 64, 32), [radius])

  // ---- Materials (built once) ----------------------------------------------

  const surfaceMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   SURFACE_VERT,
        fragmentShader: SURFACE_FRAG,
        uniforms: {
          uLightDir:  { value: LIGHT_DIR },
          uCameraPos: { value: camera.position },
          uTime:      { value: 0 },
        },
      }),
    // camera.position is a stable Vector3 reference — safe to include
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radius],
  )

  const cloudsMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   CLOUDS_VERT,
        fragmentShader: CLOUDS_FRAG,
        uniforms: {
          uLightDir: { value: LIGHT_DIR },
          uOpacity:  { value: cloudOpacity },
        },
        transparent: true,
        depthWrite:  false,
        blending:    NormalBlending,
      }),
    [radius, cloudOpacity],
  )

  const atmoMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: {
          uLightDir:   { value: LIGHT_DIR },
          uCameraPos:  { value: camera.position },
          uIntensity:  { value: atmosphereIntensity },
        },
        transparent: true,
        depthWrite:  false,
        blending:    AdditiveBlending,
        side:        BackSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radius, atmosphereIntensity],
  )

  // ---- Animation (no allocations per frame) --------------------------------

  useFrame((_, delta) => {
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += delta * rotationSpeed
      ;(surfaceRef.current.material as ShaderMaterial).uniforms.uTime.value += delta
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * cloudSpeed
    }
  })

  // ---- Render --------------------------------------------------------------

  return (
    <group>
      {/* 1 — Planet surface */}
      <mesh ref={surfaceRef} geometry={surfaceGeo} material={surfaceMat} />

      {/* 2 — Cloud layer, rotates independently */}
      <mesh ref={cloudsRef} geometry={cloudsGeo} material={cloudsMat} />

      {/* 3 — Atmosphere rim (BackSide sphere, additive) */}
      <mesh geometry={atmoGeo} material={atmoMat} />
    </group>
  )
}
