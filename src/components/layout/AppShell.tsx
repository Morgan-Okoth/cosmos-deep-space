import { CinematicCamera }   from '../../scenes/intro/CinematicCamera'
import { NebulaEnvironment } from '../../scenes/NebulaEnvironment'
import { OrbitalSystem }     from '../../scenes/planets/OrbitalSystem'
import { SceneCanvas }       from '../../scenes/SceneCanvas'
import { StarfieldPoints }   from '../../scenes/StarfieldPoints'
import { useIntroStore }     from '../../store/introStore'
import { ExplorationHUD }    from '../hud/ExplorationHUD'
import { IntroOverlay }      from '../ui/IntroOverlay'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'

/**
 * AppShell — full-screen COSMOS layout.
 *
 * Layering (back → front):
 *   1. R3F canvas (always rendered)
 *      a. CinematicCamera  — intro sequence + exploration camera focus
 *      b. NebulaEnvironment
 *      c. StarfieldPoints
 *      d. OrbitalSystem    — AURELIA (selectable) + LUNA-01 (selectable)
 *   2. IntroOverlay (DOM)  — cinematic title + buttons (intro/entering phases)
 *   3. ExplorationHUD      — selection panel + controls (active phase)
 *
 * Camera starts at [−8, 4, 42]; CinematicCamera drives it through the intro
 * sequence and then useExplorationCamera takes over for focus behaviour.
 */
export function AppShell() {
  const phase    = useIntroStore((s) => s.phase)
  const isActive = phase === 'active'

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-space text-white">
      {/* ---- 3D canvas (always live) ------------------------------------- */}
      <SceneErrorBoundary>
        <SceneCanvas cameraPosition={[-8, 4, 42]}>
          <CinematicCamera />
          <NebulaEnvironment />
          <StarfieldPoints />
          <OrbitalSystem />
        </SceneCanvas>
      </SceneErrorBoundary>

      {/* ---- Intro overlay (intro + entering phases) --------------------- */}
      <IntroOverlay />

      {/* ---- Exploration HUD (active phase) ------------------------------ */}
      <div
        style={{
          opacity:    isActive ? 1 : 0,
          transition: 'opacity 1s ease-in 0.3s',
          pointerEvents: isActive ? 'auto' : 'none',
          position: 'absolute',
          inset: 0,
          zIndex: 15,
        }}
        aria-hidden={!isActive}
      >
        <ExplorationHUD />
      </div>
    </div>
  )
}
