import { selectionActions, useSelectionStore } from '../../store/selectionStore'

/**
 * HUDControls — camera and selection action buttons.
 *
 * Rendered as a small vertical strip of text-buttons.
 * All buttons have hover/focus states and keyboard accessibility.
 */
export function HUDControls() {
  const selectedId   = useSelectionStore((s) => s.selectedId)
  const hasSelection = selectedId !== null

  return (
    <div className="hud-controls" role="toolbar" aria-label="Camera controls">
      <button
        className="hud-btn"
        onClick={selectionActions.resetCamera}
        type="button"
        title="Return to overview"
      >
        OVERVIEW
      </button>
      {hasSelection && (
        <>
          <button
            className="hud-btn hud-btn--accent"
            onClick={() => {
              // Focus is handled by useExplorationCamera watching selectedId;
              // this button just makes the intent explicit (re-selects same id).
              if (selectedId) selectionActions.select(selectedId)
            }}
            type="button"
            title="Focus selected body"
          >
            FOCUS
          </button>
          <button
            className="hud-btn"
            onClick={selectionActions.deselect}
            type="button"
            title="Deselect"
          >
            DESELECT
          </button>
        </>
      )}
    </div>
  )
}
