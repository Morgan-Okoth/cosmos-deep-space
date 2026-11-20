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
import { PlanetAurelia }   from './PlanetAurelia'
import { Moon }            from './Moon'
import { SelectionRing }   from './SelectionRing'
import { ScanOverlay }     from './ScanOverlay'
import { computeOrbitPosition, buildOrbitPath, orbitScratch } from '../../systems/orbits'
import { selectionActions, useSelectionStore, moonWorldPos } from '../../store/selectionStore'
import { useScanStore } from '../../store/scanStore'
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
  const groupRef    = useRef<Group>(null)
  const isSelected  = useSelectionStore((s) => s.selectedId === 'luna-01')
  const isScanning  = useScanStore((s) =>
    s.targetId === 'luna-01' && (s.phase === 'scanning' || s.phase === 'complete'),
  )

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    computeOrbitPosition(orbitScratch, config.orbit, clock.elapsedTime)
    group.position.copy(orbitScratch)
    moonWorldPos.copy(orbitScratch)
  })

  return (
    <group ref={groupRef}>
      <Moon
        radius={config.radius}
        rotationSpeed={config.rotationSpeed}
        lightDir={lightDir}
        onSelect={() => selectionActions.select('luna-01')}
      />
      {isSelected && (
        <SelectionRing
          innerRadius={config.radius * 1.35}
          outerRadius={config.radius * 1.55}
          tiltX={0.25}
        />
      )}
      {isScanning && <ScanOverlay radius={config.radius} />}
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
    semiMinorAxis: 4.6,
    speed:         0.22,
    inclination:   0.22,
    phase:         0.4,
  },
}

// ---------------------------------------------------------------------------
// Selectable planet wrapper
// ---------------------------------------------------------------------------

function SelectablePlanet() {
  const isSelected  = useSelectionStore((s) => s.selectedId === 'aurelia')
  const isScanning  = useScanStore((s) =>
    s.targetId === 'aurelia' && (s.phase === 'scanning' || s.phase === 'complete'),
  )

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        selectionActions.select('aurelia')
      }}
    >
      <PlanetAurelia />
      {isSelected && (
        <SelectionRing
          innerRadius={2.2 * 1.12}
          outerRadius={2.2 * 1.20}
          tiltX={0.2}
        />
      )}
      {isScanning && <ScanOverlay radius={2.2} />}
    </group>
  )
}

// ---------------------------------------------------------------------------
// OrbitalSystem
// ---------------------------------------------------------------------------

/**
 * OrbitalSystem — composes AURELIA and all orbiting bodies.
 *
 * Changes in Task 08:
 * - SelectablePlanet wraps PlanetAurelia and handles click → select('aurelia')
 * - OrbitingMoon publishes its world position to moonWorldPos each frame
 * - Selection rings appear on the selected body
 * - Clicking empty space via the canvas pointer-missed event deselects
 */
export function OrbitalSystem({ moons = [LUNA_01] }: OrbitalSystemProps) {
  return (
    <group
      onPointerMissed={() => selectionActions.deselect()}
    >
      <SelectablePlanet />
      {moons.map(moon => (
        <group key={moon.id}>
          <OrbitPath config={moon} />
          <OrbitingMoon config={moon} lightDir={LIGHT_DIR} />
        </group>
      ))}
    </group>
  )
}
