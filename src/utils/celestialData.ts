/**
 * Static descriptive data for each known celestial body.
 * These are fictional exploration entries — not real astronomical measurements.
 */
import type { CelestialInfo } from '../types/celestial'

export const CELESTIAL_DATA: Record<string, CelestialInfo> = {
  'aurelia': {
    id:             'aurelia',
    name:           'AURELIA',
    classification: 'Oceanic Exoplanet',
    attributes: [
      { label: 'Environment',  value: 'Fictional' },
      { label: 'Surface',      value: 'Ocean & continent system' },
      { label: 'Atmosphere',   value: 'Blue atmospheric envelope' },
      { label: 'Rotation',     value: 'Active' },
      { label: 'Satellites',   value: '1 — LUNA-01' },
    ],
  },
  'luna-01': {
    id:             'luna-01',
    name:           'LUNA-01',
    classification: 'Natural Satellite',
    attributes: [
      { label: 'Parent body',  value: 'AURELIA' },
      { label: 'Surface',      value: 'Rocky terrain' },
      { label: 'Atmosphere',   value: 'None detected' },
      { label: 'Orbit',        value: 'Active — elliptical' },
      { label: 'Rotation',     value: 'Active' },
    ],
  },
}
