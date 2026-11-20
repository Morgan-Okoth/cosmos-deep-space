/**
 * Shared TypeScript types for the COSMOS celestial body system.
 * Used by orbital utilities, planet components and moon components.
 */

/**
 * Parameters that fully describe a Keplerian-style elliptical (or circular)
 * orbit.  All distances are in world units; all angles in radians.
 */
export type OrbitalParams = {
  /** Semi-major axis — the longest radius of the ellipse. */
  semiMajorAxis: number

  /**
   * Semi-minor axis.
   * Pass a value equal to `semiMajorAxis` for a circular orbit.
   */
  semiMinorAxis: number

  /**
   * Angular speed of the orbiting body in radians per second.
   * Positive = counter-clockwise when viewed from above (Y-up).
   */
  speed: number

  /**
   * Orbital inclination in radians, measured from the reference plane (XZ).
   * 0 = equatorial orbit, Math.PI/2 = polar orbit.
   * @default 0
   */
  inclination?: number

  /**
   * Phase offset in radians — the angle at t=0.
   * Useful for placing multiple moons at different starting positions.
   * @default 0
   */
  phase?: number
}

/** Minimal description of a moon body used by OrbitalSystem. */
export type MoonConfig = {
  /** Unique key for React reconciliation. */
  id: string
  /** Physical radius of the moon in world units. */
  radius: number
  /** Axial rotation speed of the moon itself (rad/s). */
  rotationSpeed: number
  /** Orbital parameters describing the moon's path around its parent. */
  orbit: OrbitalParams
}

// ---------------------------------------------------------------------------
// HUD / info panel data
// ---------------------------------------------------------------------------

/** A single labelled attribute row shown in the info panel. */
export type CelestialAttribute = {
  label: string
  value: string
}

/** Static descriptive data for a celestial body's information panel. */
export type CelestialInfo = {
  id: string
  name: string
  classification: string
  attributes: CelestialAttribute[]
}
