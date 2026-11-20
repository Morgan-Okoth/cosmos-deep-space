import { Orbit } from 'lucide-react'
import { CinematicCamera }   from '../../scenes/intro/CinematicCamera'
import { NebulaEnvironment } from '../../scenes/NebulaEnvironment'
import { OrbitalSystem }     from '../../scenes/planets/OrbitalSystem'
import { SceneCanvas }       from '../../scenes/SceneCanvas'
import { StarfieldPoints }   from '../../scenes/StarfieldPoints'
import { useIntroStore }     from '../../store/introStore'
import { IntroOverlay }      from '../ui/IntroOverlay'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
import { StatusBadge }        from '../ui/StatusBadge'

/**
 * AppShell — full-screen COSMOS layout.
 *
 * Layering (back → front):
 *   1. R3F canvas (always rendered)
 *      a. CinematicCamera  — imperatively drives camera during intro phases
 *      b. NebulaEnvironment
 *      c. StarfieldPoints
 *      d. OrbitalSystem    — AURELIA + LUNA-01
 *   2. IntroOverlay (DOM) — title + buttons; mounts during intro/entering
 *   3. Main UI overlay    — COSMOS branding + status; visible in active phase
 *
 * The canvas is never unmounted — the planet keeps rendering during the
 * cinematic.  Only the DOM overlay layers swap.
 *
 * Camera starts deep in space via CinematicCamera keyframes, beginning at
 * [−8, 4, 42], and arrives at [0, 2, 13] by the end of the sequence.
 * SceneCanvas.cameraPosition sets only the initial position; after mount
 * CinematicCamera takes over.
 */
export function AppShell() {
  const phase = useIntroStore((s) => s.phase)
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

      {/* ---- Intro title / buttons (intro + entering phases) ------------- */}
      <IntroOverlay />

      {/* ---- Main exploration UI (active phase only) --------------------- */}
      <div
        className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-between px-6 py-10 text-center"
        style={{
          opacity:    isActive ? 1 : 0,
          transition: 'opacity 1s ease-in 0.3s',
        }}
        aria-hidden={!isActive}
      >
        <header className="flex flex-col items-center gap-3">
          <Orbit className="text-accent" size={28} strokeWidth={1} />
          <h1 className="text-3xl font-light leading-none tracking-[0.45em] text-white sm:text-5xl">
            COSMOS
          </h1>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">
            Deep-Space Exploration Interface
          </p>
        </header>
        <StatusBadge />
      </div>
    </div>
  )
}
