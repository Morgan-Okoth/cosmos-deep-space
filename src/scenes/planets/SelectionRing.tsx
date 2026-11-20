import { useMemo } from 'react'
import { RingGeometry, MeshBasicMaterial, AdditiveBlending } from 'three'

type SelectionRingProps = {
  /** Inner radius of the ring — should sit just outside the body's surface. */
  innerRadius: number
  /** Outer radius of the ring. Typically innerRadius + 0.08. */
  outerRadius: number
  /** Tilt the ring slightly to face the camera better (radians). */
  tiltX?: number
}

/**
 * SelectionRing — a thin, faintly glowing ring that appears around a
 * selected celestial body.
 *
 * Rendered as a flat RingGeometry with MeshBasicMaterial + AdditiveBlending.
 * The ring is a child of the body's group so it moves with it automatically.
 * Very restrained — the accent colour at ~25% opacity.
 */
export function SelectionRing({
  innerRadius,
  outerRadius,
  tiltX = 0.3,
}: SelectionRingProps) {
  const geometry = useMemo(
    () => new RingGeometry(innerRadius, outerRadius, 72),
    [innerRadius, outerRadius],
  )

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color:       0x5fd3f0,   // accent cyan
        transparent: true,
        opacity:     0.28,
        blending:    AdditiveBlending,
        depthWrite:  false,
        side:        2,          // DoubleSide = 2
      }),
    [],
  )

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[tiltX, 0, 0]}
    />
  )
}
