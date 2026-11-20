/**
 * Intro phase state — implemented as a simple module-level store using
 * React's useSyncExternalStore to avoid any Zustand/React dual-instance
 * issues that can arise with the Vite dep-optimizer.
 *
 * API mirrors the previous Zustand version so call-sites are unchanged.
 */
import { useSyncExternalStore } from 'react'

export type IntroPhase = 'intro' | 'entering' | 'active'

type IntroState = {
  phase: IntroPhase
}

type Listener = () => void

// ---------------------------------------------------------------------------
// Module-level store (singleton)
// ---------------------------------------------------------------------------

let state: IntroState = { phase: 'intro' }
const listeners = new Set<Listener>()

function notifyAll() {
  listeners.forEach((l) => l())
}

function getSnapshot(): IntroState {
  return state
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ---------------------------------------------------------------------------
// Actions (can be called from anywhere, including inside R3F frame loops)
// ---------------------------------------------------------------------------

export const introActions = {
  enterCosmos() {
    if (state.phase !== 'intro') return
    state = { phase: 'entering' }
    notifyAll()
  },
  skipIntro() {
    state = { phase: 'active' }
    notifyAll()
  },
  completeEntry() {
    state = { phase: 'active' }
    notifyAll()
  },
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useIntroStore — subscribe to the intro phase state.
 *
 * Usage:
 *   const phase = useIntroStore((s) => s.phase)
 *
 * The selector is applied on every render to match the Zustand API shape.
 */
export function useIntroStore<T>(selector: (s: IntroState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()))
}
