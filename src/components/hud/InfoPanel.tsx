import { useSelectionStore, selectionActions } from '../../store/selectionStore'
import { CELESTIAL_DATA } from '../../utils/celestialData'

/**
 * InfoPanel — floating information panel for the selected celestial body.
 *
 * Animates in from the right using CSS.  Displays classification, fictional
 * attributes and a close button.  Labelled explicitly as scene data, not
 * real astronomical measurements.
 */
export function InfoPanel() {
  const selectedId = useSelectionStore((s) => s.selectedId)

  if (!selectedId) return null

  const data = CELESTIAL_DATA[selectedId]
  if (!data) return null

  return (
    <aside className="hud-panel" aria-label={`${data.name} information`}>
      {/* Header */}
      <div className="hud-panel-header">
        <div>
          <div className="hud-panel-eyebrow">CELESTIAL BODY</div>
          <h2 className="hud-panel-title">{data.name}</h2>
          <div className="hud-panel-classification">{data.classification}</div>
        </div>
        <button
          className="hud-panel-close"
          onClick={selectionActions.deselect}
          aria-label="Deselect"
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Divider */}
      <div className="hud-panel-divider" />

      {/* Attributes */}
      <dl className="hud-panel-attrs">
        {data.attributes.map((attr) => (
          <div key={attr.label} className="hud-panel-attr-row">
            <dt className="hud-panel-attr-label">{attr.label}</dt>
            <dd className="hud-panel-attr-value">{attr.value}</dd>
          </div>
        ))}
      </dl>

      {/* Footer note */}
      <p className="hud-panel-note">
        Scene data · Fictional exploration entry
      </p>
    </aside>
  )
}
