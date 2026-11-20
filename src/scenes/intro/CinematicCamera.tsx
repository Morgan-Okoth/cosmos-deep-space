import { useCinematicCamera }     from '../../hooks/useCinematicCamera'
import { useExplorationCamera }   from '../../hooks/useExplorationCamera'

/**
 * CinematicCamera — a renderless component placed inside <SceneCanvas>.
 *
 * Runs both camera hooks in one component so only one useFrame registration
 * exists per hook.  useCinematicCamera handles the intro sequence;
 * useExplorationCamera handles focus/overview once the intro is complete.
 */
export function CinematicCamera() {
  useCinematicCamera()
  useExplorationCamera()
  return null
}
