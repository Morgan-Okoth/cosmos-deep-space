import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  AdditiveBlending,
  Vector3,
  Group,
  Line,
} from 'three'
import { PlanetAurelia } from './PlanetAurelia'
import { Moon }          from './Moon'
import { computeOrbitPosition, buildOrbitPath, orbitScratch } from '../../systems/orbits'
import type { MoonConfig } from '../../types/celestial'

// ---------------------------------------------------------------------------
// Orbit path line (built once, purely visual)
// ---------------------------------------------------------------------------

type OrbitPathProps = {
  config: MoonConfig
}

function OrbitPath({ config }: OrbitPathProps) {
  const lineObject = useMemo(() => {
    const pts   = buildOrbitPath(config.orbit, 128)
    const flat  = new Float32Array(pts.length * 3)
    pts.forEach((v, i) => { flat[i * 3] = v.x; flat[i * 3 + 1] = v.y; flat[i * 3 + 2] = v.z })
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(flat, 3))
    const mat = new LineBasicMaterial({
      color:       0x4488aa,
      transparent: true,
      opacity:     0.18,
      blending:    AdditiveBlending,
      depthWrite:  false,
    })
    return new Line(geo, mat)
  }, [config.orbit])

  return <primitive object={lineObject} />
}

// ---------------------------------------------------------------------------
// Single orbiting moon wrapper — handles position update each frame
// ---------------------------------------------------------------------------

type OrbitingMoonProps = {
  config: MoonConfig
  lightDir: Vector3
}

function OrbitingMoon({ config, lightDir }: OrbitingMoonProps) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    // Use elapsed time for deterministic, drift-free positioning
    computeOrbitPosition(orbitScratch, config.orbit, clock.elapsedTime)
    group.position.copy(orbitScratch)
  })

  return (
    <group ref={groupRef}>
      <Moon
        radius={config.radius}
        rotationSpeed={config.rotationSpeed}
        lightDir={lightDir}
      />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type OrbitalSystemProps = {
  /** Moons to place in orbit around AURELIA. */
  moons?: MoonConfig[]
}

// ---------------------------------------------------------------------------
// Shared light direction — matches SceneCanvas directionalLight [5,5,5]
// ---------------------------------------------------------------------------

const LIGHT_DIR = new Vector3(5, 5, 5).normalize()

// ---------------------------------------------------------------------------
// LUNA-01 default orbital configuration
// ---------------------------------------------------------------------------

export const LUNA_01: MoonConfig = {
  id:            'luna-01',
  radius:        0.52,
  rotationSpeed: 0.012,
  orbit: {
    semiMajorAxis: 5.2,
    semiMinorAxis: 4.6,       // slight ellipse
    speed:         0.22,      // ~28s per revolution — clearly visible
    inclination:   0.22,      // ~12.6° — tilted orbit plane for visual interest
    phase:         0.4,       // start slightly offset so moon is visible at load
  },
}

// ---------------------------------------------------------------------------
// OrbitalSystem
// ---------------------------------------------------------------------------

/**
 * OrbitalSystem — composes AURELIA and all orbiting bodies into a single
 * scene group.
 *
 * Architecture:
 *   <group>                     ← scene origin
 *     <PlanetAurelia />         ← primary body at [0,0,0]
 *     {moons.map(m =>
 *       <OrbitPath />           ← the ellipse ring (static geometry)
 *       <OrbitingMoon />        ← moon body at computed orbital position
 *     )}
 *   </group>
 *
 * Adding more moons later: pass additional MoonConfig entries in the `moons`
 * prop.  Orbit calculations live in src/systems/orbits.ts and are
 * independent of this component.
 *
 * Performance notes:
 * - Orbit path is a static LineSegments — built once, never reallocated.
 * - Moon position is computed via elapsed time — deterministic, no drift.
 * - orbitScratch is a module-level Vector3 — zero allocations per frame.
 */
export function OrbitalSystem({ moons = [LUNA_01] }: OrbitalSystemProps) {
  return (
    <group>
      <PlanetAurelia />
      {moons.map(moon => (
        <group key={moon.id}>
          <OrbitPath config={moon} />
          <OrbitingMoon config={moon} lightDir={LIGHT_DIR} />
        </group>
      ))}
    </group>
  )
}
