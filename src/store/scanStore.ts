/**
 * Scan store — state machine for the deep-space scanner system.
 *
 * State transitions:
 *   idle  ──→  scanning  ──→  complete
 *                 │
 *                 └──→  idle  (if target changes or scan aborted)
 *
 * Progress is a plain number 0–100.  The scan advances via requestAnimationFrame
 * from the useScan hook (not in the store itself, to keep the store pure).
 * revealedCount tracks how many result rows have been progressively revealed.
 */
import { useSyncExternalStore } from 'react'
import type { CelestialId } from './selectionStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScanPhase = 'idle' | 'scanning' | 'complete'

export type ScanState = {
  phase:         ScanPhase
  targetId:      CelestialId | null
  progress:      number          // 0–100
  revealedCount: number          // rows revealed so far
}

type Listener = () => void

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let state: ScanState = {
  phase:         'idle',
  targetId:      null,
  progress:      0,
  revealedCount: 0,
}
const listeners = new Set<Listener>()

function notifyAll() { listeners.forEach((l) => l()) }
function getSnapshot(): ScanState { return state }
function subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l) }

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const scanActions = {
  /** Begin a scan of the given target. Resets any previous scan. */
  start(targetId: CelestialId) {
    state = { phase: 'scanning', targetId, progress: 0, revealedCount: 0 }
    notifyAll()
  },

  /** Advance progress (called from rAF loop in useScan hook). */
  setProgress(progress: number, revealedCount: number) {
    if (state.phase !== 'scanning') return
    state = { ...state, progress, revealedCount }
    notifyAll()
  },

  /** Mark scan complete. */
  complete() {
    if (state.phase !== 'scanning') return
    state = { ...state, phase: 'complete', progress: 100, revealedCount: 999 }
    notifyAll()
  },

  /** Abort or reset scan (target changed, deselected, etc.). */
  reset() {
    state = { phase: 'idle', targetId: null, progress: 0, revealedCount: 0 }
    notifyAll()
  },
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScanStore<T>(selector: (s: ScanState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()))
}

/** Direct snapshot read — safe to call outside React (e.g. in useFrame). */
export function getScanSnapshot(): ScanState { return state }
