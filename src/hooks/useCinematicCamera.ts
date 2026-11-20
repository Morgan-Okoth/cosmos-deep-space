import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, MathUtils } from 'three'
import { useIntroStore } from '../store/introStore'

// ---------------------------------------------------------------------------
// Camera keyframes
//
// Each keyframe has a world-space position and the elapsed time at which the
// camera should reach it.  The camera is smoothly lerped between keyframes
// using an exponential ease-out so it decelerates naturally at each point.
//
// All positions are designed around AURELIA at origin (radius 2.2) and
// LUNA-01 orbiting at ~5 world units.
// ---------------------------------------------------------------------------

type Keyframe = {
  time: number
  pos: [number, number, number]
  lookAt: [number, number, number]
}

const KEYFRAMES: Keyframe[] = [
  // 0 — open: deep space, stars only
  { time: 0,  pos: [-8,  4, 42], lookAt: [0, 0, 0] },
  // 1 — drift in: nebula becomes visible, planet a distant speck
  { time: 4,  pos: [18,  6, 28], lookAt: [0, 0, 0] },
  // 2 — planet reveal: tilted cinematic angle
  { time: 8,  pos: [ 6,  4, 16], lookAt: [0, 0.3, 0] },
  // 3 — final composition: matches the active orbit view
  { time: 11, pos: [ 0,  2, 13], lookAt: [0, 0.3, 0] },
]

/** Total cinematic duration in seconds before auto-settling. */
const TOTAL_DURATION = KEYFRAMES[KEYFRAMES.length - 1].time

// Pre-allocated vectors — zero per-frame heap allocation
const _targetPos    = new Vector3()
const _targetLook   = new Vector3()
const _currentLook  = new Vector3()
const _fromPos      = new Vector3()
const _fromLook     = new Vector3()
const _toPos        = new Vector3()
const _toLook       = new Vector3()

/**
 * Smooth step — cubic ease-in-out used for keyframe interpolation.
 * Returns t ∈ [0,1].
 */
function smoothstep(t: number): number {
  const c = MathUtils.clamp(t, 0, 1)
  return c * c * (3 - 2 * c)
}

/**
 * Find the two keyframes bracketing `time` and return an interpolated
 * position and look-at target.
 */
function evaluateKeyframes(
  elapsed: number,
  outPos:    Vector3,
  outLookAt: Vector3,
): void {
  const t = MathUtils.clamp(elapsed, 0, TOTAL_DURATION)

  // Find the segment
  let fromKf = KEYFRAMES[0]
  let toKf   = KEYFRAMES[KEYFRAMES.length - 1]

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (t >= KEYFRAMES[i].time && t <= KEYFRAMES[i + 1].time) {
      fromKf = KEYFRAMES[i]
      toKf   = KEYFRAMES[i + 1]
      break
    }
  }

  const segDuration = toKf.time - fromKf.time
  const rawAlpha    = segDuration > 0 ? (t - fromKf.time) / segDuration : 1
  const alpha       = smoothstep(rawAlpha)

  _fromPos.set(...fromKf.pos)
  _toPos.set(...toKf.pos)
  outPos.lerpVectors(_fromPos, _toPos, alpha)

  _fromLook.set(...fromKf.lookAt)
  _toLook.set(...toKf.lookAt)
  outLookAt.lerpVectors(_fromLook, _toLook, alpha)
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useCinematicCamera
 *
 * Must be called from a component rendered inside <Canvas>.
 *
 * Drives the R3F camera through the COSMOS intro sequence using `useFrame`.
 * When `phase === 'active'` the hook does nothing, releasing camera control
 * to whatever comes next (orbit controls etc).
 *
 * No React state updates occur in the frame loop — only imperative camera
 * mutations and an R3F clock read.
 */
export function useCinematicCamera() {
  const phase = useIntroStore((s) => s.phase)
  const { camera } = useThree()

  // Track the intro start time so elapsed is relative to when intro began
  const startTimeRef = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (phase === 'active') return

    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime
    }

    const elapsed = clock.elapsedTime - startTimeRef.current

    evaluateKeyframes(elapsed, _targetPos, _targetLook)

    if (phase === 'entering') {
      // During the enter transition, hold camera at final position
      _targetPos.set(...KEYFRAMES[KEYFRAMES.length - 1].pos)
      _targetLook.set(...KEYFRAMES[KEYFRAMES.length - 1].lookAt)
    }

    // Smooth exponential approach — feels organic, not mechanical
    const lerpSpeed = phase === 'entering' ? 3.0 : 1.2
    camera.position.lerp(_targetPos, lerpSpeed * (1 / 60))

    // Compute look-at direction and smoothly rotate camera
    _currentLook.copy(_targetLook)
    camera.lookAt(_currentLook)
  })
}
