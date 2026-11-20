/**
 * useExplorationCamera
 *
 * Runs only when phase === 'active' (after the cinematic intro completes).
 * Smoothly moves the camera toward:
 *   - The selected celestial body (focus mode)
 *   - The overview composition (no selection)
 *
 * Uses elapsed-time-based lerp — no React state updates in the frame loop.
 * Pre-allocated vectors avoid per-frame allocations.
 */
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useIntroStore }    from '../store/introStore'
import { useSelectionStore, moonWorldPos } from '../store/selectionStore'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default overview camera position (matches the cinematic final keyframe). */
const OVERVIEW_POS    = new Vector3(0, 2, 13)
const OVERVIEW_LOOK   = new Vector3(0, 0.3, 0)

/** How far the camera parks from a focused body, as a multiple of its radius. */
const FOCUS_DISTANCE_PLANET = 7.5   // world units from Aurelia centre
const FOCUS_DISTANCE_MOON   = 3.0   // world units from Luna-01 centre

/** Lerp speed — fraction of remaining distance closed per second (exponential). */
const LERP_SPEED = 2.2

// Pre-allocated scratch vectors
const _desiredPos  = new Vector3()
const _desiredLook = new Vector3()
const _bodyPos     = new Vector3()

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExplorationCamera() {
  const phase      = useIntroStore((s) => s.phase)
  const selectedId = useSelectionStore((s) => s.selectedId)
  const { camera } = useThree()

  // Tracks whether we have taken control from the cinematic hook
  const activeRef = useRef(false)

  useFrame((_, delta) => {
    if (phase !== 'active') return

    // On first active frame, snapshot current camera position so we don't
    // jump — the cinematic hook left it somewhere sensible.
    if (!activeRef.current) {
      activeRef.current = true
    }

    if (selectedId === null) {
      // ---- Return to overview --------------------------------------------
      _desiredPos.copy(OVERVIEW_POS)
      _desiredLook.copy(OVERVIEW_LOOK)
    } else if (selectedId === 'aurelia') {
      // ---- Focus Aurelia (always at scene origin) -------------------------
      _bodyPos.set(0, 0, 0)
      // Camera stays slightly above the equator, offset toward viewer
      _desiredPos.set(0, 2, FOCUS_DISTANCE_PLANET)
      _desiredLook.copy(_bodyPos)
    } else {
      // ---- Focus LUNA-01 (position written by OrbitingMoon each frame) ----
      _bodyPos.copy(moonWorldPos)
      // Offset camera toward viewer by FOCUS_DISTANCE_MOON
      _desiredPos.set(
        _bodyPos.x * 0.6,
        _bodyPos.y + 1.2,
        _bodyPos.z + FOCUS_DISTANCE_MOON,
      )
      _desiredLook.copy(_bodyPos)
    }

    // Smooth exponential approach
    const t = 1 - Math.exp(-LERP_SPEED * delta)
    camera.position.lerp(_desiredPos, t)
    camera.lookAt(_desiredLook)
  })
}
