import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  Float32BufferAttribute,
  AdditiveBlending,
  ShaderMaterial,
  Points,
  Color,
} from 'three'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StarfieldPointsProps = {
  /**
   * Total number of stars. Default 8 000 — a good balance between density
   * and performance on integrated GPUs.
   */
  count?: number

  /**
   * Radius of the star sphere in world units. Stars are distributed inside
   * this sphere so they surround the camera regardless of rotation direction.
   */
  radius?: number
}

// ---------------------------------------------------------------------------
// Shader source
//
// A minimal point-sprite shader that:
//   • honours a per-vertex `size` attribute so stars have varied apparent sizes
//   • reads per-vertex `color` and `alpha` attributes for variety
//   • draws a soft circular disc (smoothstep vignette) so points look like
//     glowing pinpoints rather than hard squares
// ---------------------------------------------------------------------------

const VERT = /* glsl */ `
  attribute float size;
  attribute vec3  starColor;
  attribute float alpha;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vColor = starColor;
    vAlpha = alpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // sizeAttenuation: scale with distance the same way PointsMaterial would
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position  = projectionMatrix * mvPosition;
  }
`

const FRAG = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Convert point-coord to -1..1 circle, discard outside radius
    vec2  uv   = gl_PointCoord * 2.0 - 1.0;
    float dist = dot(uv, uv);           // squared distance from centre
    if (dist > 1.0) discard;

    // Soft glow: bright core fading to transparent edge
    float glow = 1.0 - smoothstep(0.0, 1.0, dist);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`

// ---------------------------------------------------------------------------
// Colour palette  (cool-white dominant, rare warm accent)
// ---------------------------------------------------------------------------

const PALETTE: [string, number][] = [
  ['#ddeeff', 0.42], // cool white-blue  — most common
  ['#c8d8ff', 0.22], // soft blue
  ['#eef5ff', 0.20], // near white
  ['#fffef8', 0.10], // pure white
  ['#ffeedd', 0.06], // rare warm
]

function pickPaletteColor(rand: number): Color {
  let acc = 0
  for (const [hex, weight] of PALETTE) {
    acc += weight
    if (rand < acc) return new Color(hex)
  }
  return new Color(PALETTE[0][0])
}

// ---------------------------------------------------------------------------
// Geometry builder (called once, inside useMemo)
// ---------------------------------------------------------------------------

function buildStarGeometry(count: number, radius: number): BufferGeometry {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const alphas = new Float32Array(count)

  const r2 = radius * radius
  let i = 0

  while (i < count) {
    // Rejection-sample inside the sphere so density is uniform in 3-D volume,
    // not biased toward the corners of a cube.
    const x = (Math.random() * 2 - 1) * radius
    const y = (Math.random() * 2 - 1) * radius
    const z = (Math.random() * 2 - 1) * radius
    if (x * x + y * y + z * z > r2) continue

    // Push the star away from the camera origin so the core isn't empty.
    // Stars closer than 50 units are re-rolled.
    if (x * x + y * y + z * z < 50 * 50) continue

    const base = i * 3
    positions[base]     = x
    positions[base + 1] = y
    positions[base + 2] = z

    // Size: most stars are small; a few are larger (distant giants).
    // Using a power distribution skewed toward small values.
    const sizeRand = Math.random()
    sizes[i] = 0.4 + Math.pow(sizeRand, 2.5) * 3.2

    // Colour
    const col = pickPaletteColor(Math.random())
    colors[base]     = col.r
    colors[base + 1] = col.g
    colors[base + 2] = col.b

    // Alpha: faint stars are more common — universe feels deep, not neon
    alphas[i] = 0.35 + Math.random() * 0.65

    i++
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position',  new Float32BufferAttribute(positions, 3))
  geo.setAttribute('size',      new Float32BufferAttribute(sizes,     1))
  geo.setAttribute('starColor', new Float32BufferAttribute(colors,    3))
  geo.setAttribute('alpha',     new Float32BufferAttribute(alphas,    1))
  return geo
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StarfieldPoints({
  count  = 8_000,
  radius = 450,
}: StarfieldPointsProps) {
  const pointsRef = useRef<Points>(null)

  // Build geometry once — useMemo runs only when count/radius change
  const geometry = useMemo(
    () => buildStarGeometry(count, radius),
    [count, radius],
  )

  // Build material once
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   VERT,
        fragmentShader: FRAG,
        blending:       AdditiveBlending,
        depthWrite:     false,     // transparent particles never occlude each other
        transparent:    true,
      }),
    [],
  )

  // Extremely slow Y-rotation — imperceptible in a few seconds but over time
  // subtly shifts which stars are in frame, reinforcing the sense of a vast
  // 3-D volume.  No allocations: we mutate the rotation value in place.
  useFrame((_, delta) => {
    const pts = pointsRef.current
    if (!pts) return
    pts.rotation.y += delta * 0.004
    pts.rotation.x += delta * 0.001
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
