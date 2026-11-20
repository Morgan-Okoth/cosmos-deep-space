import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  PlaneGeometry,
  ShaderMaterial,
  AdditiveBlending,
  FrontSide,
  Mesh,
  Color,
} from 'three'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type NebulaEnvironmentProps = {
  /**
   * Overall brightness multiplier for all nebula layers.
   * 0 = invisible, 1 = default, >1 = brighter.
   * @default 1
   */
  intensity?: number

  /**
   * Cloud density. Controls how solid the cloud shapes appear.
   * 0 = wispy, 1 = dense.  Clamped to [0,1] in the shader.
   * @default 0.55
   */
  density?: number
}

// ---------------------------------------------------------------------------
// Vertex shader — shared across all layers
//
// A simple pass-through that forwards the UV and world-space position to the
// fragment stage so the fragment can compute screen-relative vignettes.
// ---------------------------------------------------------------------------

const VERT = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv        = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ---------------------------------------------------------------------------
// Fragment shader — FBM nebula cloud
//
// A 3-octave fractional Brownian motion (FBM) built on a cheap value-noise
// hash gives organic, aperiodic cloud shapes.  The result is multiplied by:
//   • a smooth radial vignette — fades the quad edges so there are no hard
//     rectangle seams visible in the scene
//   • uIntensity and uDensity uniforms — controlled by props
//   • uColor — per-layer hue
// ---------------------------------------------------------------------------

const FRAG = /* glsl */ `
  uniform vec3  uColor;
  uniform float uIntensity;
  uniform float uDensity;
  uniform float uTime;    // slow drift, tiny offset to the noise lookup

  varying vec2 vUv;

  // --------------- value noise hash ----------------------------------------
  float hash(vec2 p) {
    p  = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  // 2-D value noise with bilinear interpolation
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);   // smoothstep interpolation

    return mix(
      mix(hash(i),              hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // 3-octave fractional Brownian motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amp   = 0.5;
    float freq  = 1.0;

    for (int i = 0; i < 3; i++) {
      value += amp * noise(p * freq);
      freq  *= 2.1;
      amp   *= 0.48;
    }
    return value;
  }

  void main() {
    // Remap UV to -1..1 centred coordinates
    vec2 centered = vUv * 2.0 - 1.0;

    // Smooth radial vignette — fades the billboard edges to transparent
    float vignette = 1.0 - smoothstep(0.35, 1.0, length(centered));

    // Sample FBM with a tiny time-based scroll — imperceptible per frame
    // but over minutes the cloud shapes breathe without distracting motion
    vec2 noiseUv  = vUv * 2.4 + vec2(uTime * 0.004, uTime * 0.0025);
    float cloud   = fbm(noiseUv);

    // Threshold + soften: values below (1-density) are transparent
    float thresh  = 1.0 - clamp(uDensity, 0.0, 1.0);
    float alpha   = smoothstep(thresh, thresh + 0.45, cloud);

    // Final compositing
    float brightness = alpha * vignette * uIntensity * 0.72;
    if (brightness < 0.001) discard;

    gl_FragColor = vec4(uColor * brightness, brightness);
  }
`

// ---------------------------------------------------------------------------
// Layer definitions
//
// Each layer is a large quad placed at a specific location and orientation so
// the nebula feels spatially distributed — not a single flat backdrop.
// Fields:
//   position  [x, y, z]       — world position of the quad centre
//   rotation  [rx, ry, rz]    — Euler angles in radians
//   scale     [sx, sy]        — quad plane scale
//   color                     — nebula hue for this layer
//   driftY    rad/s            — unique slow Y-rotation speed (applied in useFrame)
//   driftX    rad/s            — unique slow X-rotation speed
// ---------------------------------------------------------------------------

type LayerDef = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number]
  color: string
  driftY: number
  driftX: number
}

const LAYERS: LayerDef[] = [
  {
    // ---- Layer 0 — distant indigo backdrop, slightly above centre ---------
    position: [0, 60, -340],
    rotation: [0.08, 0, 0],
    scale: [620, 420],
    color: '#1a1040',      // dark indigo
    driftY: 0.0010,
    driftX: 0.0004,
  },
  {
    // ---- Layer 1 — violet cloud to the upper-right, mid distance ----------
    position: [180, 110, -220],
    rotation: [0.22, -0.35, 0.12],
    scale: [480, 340],
    color: '#2d1060',      // deep violet
    driftY: -0.0014,
    driftX: 0.0007,
  },
  {
    // ---- Layer 2 — blue-cobalt to the lower-left, mid distance ------------
    position: [-200, -80, -190],
    rotation: [-0.18, 0.4, -0.09],
    scale: [520, 360],
    color: '#071840',      // deep cobalt blue
    driftY: 0.0008,
    driftX: -0.0005,
  },
  {
    // ---- Layer 3 — restrained magenta accent, close-ish, upper-left -------
    position: [-140, 130, -130],
    rotation: [0.3, 0.55, 0.15],
    scale: [340, 260],
    color: '#280d20',      // very dark magenta / burgundy
    driftY: -0.0018,
    driftX: 0.0003,
  },
  {
    // ---- Layer 4 — blue-violet, wide sweep below camera -------------------
    position: [80, -150, -280],
    rotation: [-0.25, -0.2, 0.05],
    scale: [580, 400],
    color: '#160c38',      // blue-violet
    driftY: 0.0006,
    driftX: 0.0010,
  },
]

// ---------------------------------------------------------------------------
// Single layer component (internal, not exported)
// ---------------------------------------------------------------------------

type NebulaLayerProps = {
  def: LayerDef
  geometry: PlaneGeometry
  intensity: number
  density: number
}

function NebulaLayer({ def, geometry, intensity, density }: NebulaLayerProps) {
  const meshRef = useRef<Mesh>(null)

  const material = useMemo(() => {
    const col = new Color(def.color)
    return new ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uColor:     { value: col },
        uIntensity: { value: intensity },
        uDensity:   { value: density },
        uTime:      { value: 0 },
      },
      blending:    AdditiveBlending,
      depthWrite:  false,
      transparent: true,
      side:        FrontSide,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.color, intensity, density])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    // Imperceptible drift — unique per layer for spatial convincingness
    mesh.rotation.y += delta * def.driftY
    mesh.rotation.x += delta * def.driftX
    // Advance uTime for the subtle cloud breathe (no allocation — mutation)
    ;(mesh.material as ShaderMaterial).uniforms.uTime.value += delta
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={def.position}
      rotation={def.rotation}
      scale={[def.scale[0], def.scale[1], 1]}
    />
  )
}

// ---------------------------------------------------------------------------
// NebulaEnvironment — the exported, reusable component
// ---------------------------------------------------------------------------

/**
 * NebulaEnvironment
 *
 * Renders 5 large billboard quads at varied positions, orientations and
 * distances to create a layered deep-space nebula atmosphere.  Each quad runs
 * an FBM cloud shader in its fragment stage and drifts at its own unique rate.
 *
 * Place this BEFORE <StarfieldPoints /> inside <SceneCanvas> so the nebula
 * renders as the deepest layer, behind the stars.
 *
 * Performance notes:
 * - 5 draw calls total; geometry is shared across layers via a single useMemo.
 * - No allocations per frame — only uniform value mutation + rotation increment.
 * - AdditiveBlending + depthWrite:false avoids z-fighting with the starfield.
 * - FBM runs 3 octaves only; each sample is a simple hash/mix, not a texture.
 */
export function NebulaEnvironment({
  intensity = 1,
  density   = 0.55,
}: NebulaEnvironmentProps) {
  // Shared 1×1 plane geometry; each layer scales it via the mesh scale prop.
  const geometry = useMemo(() => new PlaneGeometry(1, 1, 1, 1), [])

  return (
    <>
      {LAYERS.map((def, i) => (
        <NebulaLayer
          key={i}
          def={def}
          geometry={geometry}
          intensity={intensity}
          density={density}
        />
      ))}
    </>
  )
}
