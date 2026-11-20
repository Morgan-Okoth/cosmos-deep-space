import { useCinematicCamera } from '../../hooks/useCinematicCamera'

/**
 * CinematicCamera — a renderless component placed inside <SceneCanvas>.
 *
 * It simply calls the useCinematicCamera hook which imperatively drives the
 * R3F camera through the intro sequence.  Keeping it as a dedicated component
 * (rather than inlining the hook in OrbitalSystem) maintains separation of
 * concerns — the camera controller is independent of scene content.
 *
 * Place this BEFORE scene content children so it registers its useFrame
 * callback early.
 */
export function CinematicCamera() {
  useCinematicCamera()
  return null
}
