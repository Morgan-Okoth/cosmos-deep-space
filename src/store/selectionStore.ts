/**
 * Selection store — tracks which celestial body (if any) the user has
 * selected, and what camera mode is active.
 *
 * Uses the same useSyncExternalStore pattern as introStore to avoid any
 * Zustand / React dual-instance issues with the Vite dep-optimizer.
 */
import { useSyncExternalStore } from 'react'
import { Vector3 } from 'three'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CelestialId = 'aurelia' | 'luna-01'

export type CameraMode = 'overview' | 'focused'

type SelectionState = {
  selectedId:  CelestialId | null
  cameraMode:  CameraMode
}

type Listener = () => void

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

let state: SelectionState = {
  selectedId: null,
  cameraMode: 'overview',
}
const listeners = new Set<Listener>()

function notifyAll() {
  listeners.forEach((l) => l())
}

function getSnapshot(): SelectionState {
  return state
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ---------------------------------------------------------------------------
// Shared moon world position — written by OrbitingMoon each frame,
// read by useExplorationCamera without any React state overhead.
// ---------------------------------------------------------------------------
export const moonWorldPos = new Vector3()

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const selectionActions = {
  select(id: CelestialId) {
    state = { selectedId: id, cameraMode: 'focused' }
    notifyAll()
  },
  deselect() {
    state = { selectedId: null, cameraMode: 'overview' }
    notifyAll()
  },
  resetCamera() {
    state = { ...state, cameraMode: 'overview', selectedId: null }
    notifyAll()
  },
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSelectionStore<T>(selector: (s: SelectionState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()))
}
