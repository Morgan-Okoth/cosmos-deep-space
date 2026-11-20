import { Orbit } from 'lucide-react'
import { EngineTestScene } from '../../scenes/EngineTestScene'
import { SceneCanvas } from '../../scenes/SceneCanvas'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
import { Starfield } from '../ui/Starfield'
import { StatusBadge } from '../ui/StatusBadge'

/**
 * AppShell — full-screen COSMOS layout.
 *
 * Layering (back → front):
 *   1. CSS starfield      — ambient deep-space backdrop (Task 01)
 *   2. 3D engine canvas    — transparent R3F canvas with the engine test scene
 *   3. UI overlay          — COSMOS branding + system status
 */
export function AppShell() {
  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-space text-white">
      <Starfield />
      <SceneErrorBoundary>
        <SceneCanvas>
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
