import { Orbit } from 'lucide-react'
import { useSelectionStore } from '../../store/selectionStore'
import { HUDControls } from './HUDControls'
import { InfoPanel }   from './InfoPanel'
import { StatusBadge } from '../ui/StatusBadge'

/**
 * ExplorationHUD — full exploration interface rendered above the 3D canvas.
 *
 * Layout:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  [COSMOS brand + status]           [camera controls]    │  ← top bar
 *   │                                                         │
 *   │                                                         │  ← 3D scene
 *   │                                             [InfoPanel] │  ← right side
 *   │                                                         │
 *   │  [coord strip]                   [SYSTEM INITIALIZED]   │  ← bottom bar
 *   └─────────────────────────────────────────────────────────┘
 *
 * The InfoPanel slides in from the right when a body is selected.
 * All DOM elements use pointer-events-auto selectively so clicks on the
 * 3D scene pass through the transparent areas.
 */
export function ExplorationHUD() {
  const selectedId   = useSelectionStore((s) => s.selectedId)
  const cameraMode   = useSelectionStore((s) => s.cameraMode)

  // Scene-space coordinates are intentionally approximate and labelled as such
  const coordLabel = selectedId === 'aurelia'
    ? 'SYS · 0.000 · 0.000 · 0.000'
    : selectedId === 'luna-01'
      ? 'SYS · ORBITAL PATH'
      : 'SYS · OVERVIEW'

  return (
    <div className="hud-root" aria-label="Exploration HUD">

      {/* ---- Top bar --------------------------------------------------- */}
      <header className="hud-topbar">
        {/* Brand */}
        <div className="hud-brand">
          <Orbit size={18} strokeWidth={1} className="hud-brand-icon" />
          <span className="hud-brand-name">COSMOS</span>
          {selectedId && (
            <span className="hud-selected-name">
              {selectedId === 'aurelia' ? 'AURELIA' : 'LUNA-01'}
            </span>
          )}
        </div>

        {/* Camera mode badge */}
        <div className="hud-mode-badge">
          <span className="hud-mode-dot" />
          {cameraMode === 'focused' ? 'FOCUSED' : 'OVERVIEW'}
        </div>

        {/* Controls */}
        <HUDControls />
      </header>

      {/* ---- Info panel (right side) ----------------------------------- */}
      <div className="hud-panel-container" aria-live="polite">
        <InfoPanel />
      </div>

      {/* ---- Bottom bar ------------------------------------------------ */}
      <footer className="hud-bottombar">
        <div className="hud-coords">{coordLabel}</div>
        <StatusBadge />
      </footer>

    </div>
  )
}
