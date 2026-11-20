import { Orbit } from 'lucide-react'
import { EngineTestScene } from '../../scenes/EngineTestScene'
import { SceneCanvas } from '../../scenes/SceneCanvas'
import { StarfieldPoints } from '../../scenes/StarfieldPoints'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
import { StatusBadge } from '../ui/StatusBadge'

/**
 * AppShell — full-screen COSMOS layout.
 *
 * Layering (back → front):
 *   1. R3F canvas  — deep-space background color + 3D starfield + test mesh
 *   2. UI overlay  — pointer-events-none COSMOS branding + system status
 *
 * The CSS `.starfield` layer from Task 01 is superseded by the 3D starfield
 * added in Task 03; the WebGL renderer now owns the full background.
 */
export function AppShell() {
  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-space text-white">
      <SceneErrorBoundary>
        <SceneCanvas>
          <StarfieldPoints />
          <EngineTestScene />
        </SceneCanvas>
      </SceneErrorBoundary>
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-between px-6 py-10 text-center">
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
