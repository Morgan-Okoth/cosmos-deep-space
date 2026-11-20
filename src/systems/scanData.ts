/**
 * Fictional scan data for COSMOS celestial bodies.
 *
 * All values are invented for narrative/exploratory purposes.
 * They are NOT real astronomical measurements.
 *
 * Data is organised into ScanCategory objects each containing multiple
 * ScanResult rows.  Categories are revealed progressively during the scan
 * (each category unlocks when progress crosses its threshold).
 */

export type ScanResult = {
  label: string
  value: string
}

export type ScanCategory = {
  /** Percentage threshold at which this category unlocks (0–100). */
  threshold: number
  title:     string
  results:   ScanResult[]
}

export type ScanProfile = {
  id:         string
  name:       string
  preamble:   string   // shown while scanning
  categories: ScanCategory[]
}

// ---------------------------------------------------------------------------
// AURELIA
// ---------------------------------------------------------------------------

const AURELIA_SCAN: ScanProfile = {
  id:       'aurelia',
  name:     'AURELIA',
  preamble: 'Surface & atmospheric analysis in progress…',
  categories: [
    {
      threshold: 0,
      title:     'Surface Classification',
      results: [
        { label: 'Type',         value: 'Oceanic exoplanet (fictional)' },
        { label: 'Surface type', value: 'Liquid ocean dominant' },
      ],
    },
    {
      threshold: 25,
      title:     'Ocean Coverage',
      results: [
        { label: 'Coverage',     value: 'Extensive — multi-basin' },
        { label: 'Depth class',  value: 'Deep ocean basins detected' },
        { label: 'Colour index', value: 'Blue–turquoise spectrum' },
      ],
    },
    {
      threshold: 50,
      title:     'Continent Distribution',
      results: [
        { label: 'Landmass',     value: 'Irregular fragmented continents' },
        { label: 'Coverage',     value: 'Partial — scattered across surface' },
        { label: 'Terrain',      value: 'Lowland, highland & polar zones' },
      ],
    },
    {
      threshold: 75,
      title:     'Atmospheric Profile',
      results: [
        { label: 'Envelope',     value: 'Blue atmospheric rim' },
        { label: 'Cloud system', value: 'Active cloud formations' },
        { label: 'Transparency', value: 'Partial — cloud breaks visible' },
      ],
    },
    {
      threshold: 90,
      title:     'Environmental Summary',
      results: [
        { label: 'Status',       value: 'Exploration site — COSMOS' },
        { label: 'Data source',  value: 'Fictional · COSMOS project' },
        { label: 'Rotation',     value: 'Active axial rotation' },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// LUNA-01
// ---------------------------------------------------------------------------

const LUNA_01_SCAN: ScanProfile = {
  id:       'luna-01',
  name:     'LUNA-01',
  preamble: 'Surface terrain analysis in progress…',
  categories: [
    {
      threshold: 0,
      title:     'Surface Classification',
      results: [
        { label: 'Type',         value: 'Natural satellite (fictional)' },
        { label: 'Surface',      value: 'Rocky, dry terrain' },
      ],
    },
    {
      threshold: 25,
      title:     'Crater Distribution',
      results: [
        { label: 'Density',      value: 'Moderate — basin regions visible' },
        { label: 'Depth class',  value: 'Shallow to mid-depth craters' },
        { label: 'Pattern',      value: 'Non-uniform — ancient impacts' },
      ],
    },
    {
      threshold: 55,
      title:     'Terrain Profile',
      results: [
        { label: 'Relief',       value: 'Low relief — rolling grey plains' },
        { label: 'Colour range', value: 'Mid-grey to dark mare regions' },
        { label: 'Roughness',    value: 'Moderate surface variance' },
      ],
    },
    {
      threshold: 80,
      title:     'Geological Summary',
      results: [
        { label: 'Atmosphere',   value: 'None detected' },
        { label: 'Orbit',        value: 'Elliptical — active' },
        { label: 'Data source',  value: 'Fictional · COSMOS project' },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const SCAN_PROFILES: Record<string, ScanProfile> = {
  'aurelia':  AURELIA_SCAN,
  'luna-01':  LUNA_01_SCAN,
}

/** Total scan duration in milliseconds. */
export const SCAN_DURATION_MS = 6000

/** Milestone messages shown as progress crosses each threshold. */
export const SCAN_MILESTONES: { threshold: number; message: string }[] = [
  { threshold: 0,   message: 'Target locked.' },
  { threshold: 25,  message: 'Surface signature detected.' },
  { threshold: 50,  message: 'Terrain analysis complete.' },
  { threshold: 75,  message: 'Environmental profile generated.' },
  { threshold: 100, message: 'Scan complete.' },
]
