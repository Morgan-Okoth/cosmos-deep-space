import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { SphereGeometry, ShaderMaterial, AdditiveBlending, Mesh } from 'three'
import { getScanSnapshot } from '../../store/scanStore'

// ---------------------------------------------------------------------------
// Scan sweep shader
//
// A transparent sphere rendered over the planet body.
// The fragment shader draws:
//   1. A horizontal scan band sweeping from south pole to north pole as
//      uProgress goes 0 → 1 (the "scan front").
//   2. A subtle grid of latitude/longitude lines on the already-scanned
//      hemisphere, fading out above the scan front.
//   3. A thin bright line at the exact scan front position.
//
// AdditiveBlending + depthWrite:false — adds glow without hiding the planet.
// ---------------------------------------------------------------------------

const SCAN_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vNormal     = normalize(normalMatrix * normal);
    vUv         = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SCAN_FRAG = /* glsl */ `
  uniform float uProgress;   // 0.0 → 1.0
  uniform float uIntensity;  // fade-in/out multiplier

  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    // Map vUv.y (0=south pole, 1=north pole) to scan progress
    float scanY   = vUv.y;                    // 0 at south, 1 at north
    float front   = uProgress;                // where the scan front is
    float scanned = step(scanY, front);       // 1.0 on the already-scanned side

    // ---- Grid pattern on scanned hemisphere ------------------------------
    // Latitude lines (horizontal)
    float latLines  = abs(sin(vUv.y * 28.0));
    float latGrid   = smoothstep(0.92, 1.0, latLines) * 0.35;

    // Longitude lines (vertical, using UV.x in screen-mapped coords)
    float lonLines  = abs(sin(vUv.x * 36.0));
    float lonGrid   = smoothstep(0.92, 1.0, lonLines) * 0.25;

    float grid      = max(latGrid, lonGrid) * scanned;

    // ---- Scan front bright line ------------------------------------------
    float frontDist = abs(scanY - front);
    float frontLine = smoothstep(0.015, 0.0, frontDist) * 0.9;

    // ---- Faint hemisphere tint -------------------------------------------
    float tint      = scanned * 0.04;

    float brightness = (grid + frontLine + tint) * uIntensity;

    if (brightness < 0.004) discard;

    // Cyan scan color
    vec3 scanColor = vec3(0.37, 0.83, 0.94);
    gl_FragColor   = vec4(scanColor * brightness, brightness * 0.65);
  }
`

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ScanOverlayProps = {
  /** Radius of the body being scanned (overlay sits 2% larger). */
  radius: number
}

// ---------------------------------------------------------------------------
// ScanOverlay
// ---------------------------------------------------------------------------

/**
 * ScanOverlay — a transparent sphere placed over a celestial body during
 * active scanning.  The scan-sweep shader draws a moving band, a grid on
 * the scanned hemisphere, and a bright front line.
 *
 * Place as a sibling of the body mesh (same parent group) so it rotates with
 * the selection ring.
 *
 * The overlay reads scan progress from getScanSnapshot() on every frame —
 * no React state reads in the hot path.
 */
export function ScanOverlay({ radius }: ScanOverlayProps) {
  const meshRef = useRef<Mesh>(null)

  const geometry = useMemo(
    () => new SphereGeometry(radius * 1.02, 64, 32),
    [radius],
  )

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   SCAN_VERT,
        fragmentShader: SCAN_FRAG,
        uniforms: {
          uProgress:  { value: 0 },
          uIntensity: { value: 0 },
        },
        transparent: true,
        depthWrite:  false,
        blending:    AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Fade in on mount, fade out on unmount via intensity
  useEffect(() => {
    const mat = material
    let raf: number
    let start: number | null = null

    function fadeIn(now: number) {
      if (start === null) start = now
      const t = Math.min((now - start) / 400, 1)
      mat.uniforms.uIntensity.value = t
      if (t < 1) raf = requestAnimationFrame(fadeIn)
    }
    raf = requestAnimationFrame(fadeIn)

    return () => {
      cancelAnimationFrame(raf)
      mat.uniforms.uIntensity.value = 0
    }
  }, [material])

  useFrame(() => {
    const snap = getScanSnapshot()
    if (!meshRef.current) return
    const mat = meshRef.current.material as ShaderMaterial
    mat.uniforms.uProgress.value = snap.progress / 100
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}
