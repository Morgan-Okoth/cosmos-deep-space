/**
 * Orbital mechanics utilities for the COSMOS celestial system.
 *
 * All calculations are pure functions of elapsed time — no accumulated state,
 * no React hooks.  Using elapsed time (not delta accumulation) means the
 * position is mathematically stable and deterministic regardless of frame rate
 * or tab-switching pauses.
 */

import { Vector3 } from 'three'
import type { OrbitalParams } from '../types/celestial'

// Pre-allocated scratch vector — avoids a `new Vector3()` every frame.
// Callers must copy the result before the next call if they need persistence.
const _scratch = new Vector3()

/**
 * Compute the world-space position of a body in an elliptical orbit at a
 * given elapsed time.
 *
 * The orbit lies in the XZ plane before inclination is applied.
 * Inclination rotates around the X axis.
 *
 * @param out       The Vector3 to write the result into (re-used to avoid allocations).
 * @param params    Orbital parameters.
 * @param elapsed   Elapsed time in seconds (e.g. `state.clock.elapsedTime`).
 * @returns         The same `out` vector, populated with the new position.
 */
export function computeOrbitPosition(
  out: Vector3,
  params: OrbitalParams,
  elapsed: number,
): Vector3 {
  const { semiMajorAxis, semiMinorAxis, speed, inclination = 0, phase = 0 } = params

  const angle = elapsed * speed + phase

  // Position in the orbital plane (XZ before inclination)
  const x = semiMajorAxis * Math.cos(angle)
  const z = semiMinorAxis * Math.sin(angle)

  // Apply inclination: rotate around X axis
  if (inclination === 0) {
    out.set(x, 0, z)
  } else {
    const cosI = Math.cos(inclination)
    const sinI = Math.sin(inclination)
    out.set(x, z * sinI, z * cosI)
  }

  return out
}

/**
 * Build an array of Vector3 positions tracing the full elliptical orbit path.
 * Used once to construct the orbit ring geometry.
 *
 * @param params    Orbital parameters.
 * @param segments  Number of points (higher = smoother circle). Default 128.
 * @returns         Array of Vector3 positions; the last point equals the first.
 */
export function buildOrbitPath(
  params: OrbitalParams,
  segments = 128,
): Vector3[] {
  const points: Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const v = new Vector3()
    // Temporarily override speed/phase to trace the full ellipse
    computeOrbitPosition(v, { ...params, speed: 1, phase: 0 }, angle)
    points.push(v)
  }
  return points
}

// Export scratch vector for callers that want zero-allocation frame updates
export { _scratch as orbitScratch }
