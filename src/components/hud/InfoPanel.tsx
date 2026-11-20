import { useSelectionStore, selectionActions } from '../../store/selectionStore'
import { useScanStore } from '../../store/scanStore'
import { useScan }      from '../../hooks/useScan'
import { CELESTIAL_DATA } from '../../utils/celestialData'
import { ScanPanel }    from './ScanPanel'

/**
 * InfoPanel — floating information panel for the selected celestial body.
 *
 * In Task 09, the panel conditionally shows:
 *   - Standard attribute list (idle scan state)
 *   - ScanPanel (scanning or complete state)
 *
 * The INITIATE SCAN button is shown at the bottom of the attribute list.
 */
export function InfoPanel() {
  const selectedId  = useSelectionStore((s) => s.selectedId)
  const scanPhase   = useScanStore((s) => s.phase)
  const scanTarget  = useScanStore((s) => s.targetId)
  const { startScan, resetScan } = useScan()

  if (!selectedId) return null

  const data = CELESTIAL_DATA[selectedId]
  if (!data) return null

  // Show scan panel if a scan is active/complete for the current selection
  const showScanPanel = (scanPhase === 'scanning' || scanPhase === 'complete')
    && scanTarget === selectedId

  return (
    <aside className="hud-panel" aria-label={`${data.name} information`}>
      {showScanPanel ? (
        <ScanPanel />
      ) : (
        <>
          {/* Header */}
          <div className="hud-panel-header">
            <div>
              <div className="hud-panel-eyebrow">CELESTIAL BODY</div>
              <h2 className="hud-panel-title">{data.name}</h2>
              <div className="hud-panel-classification">{data.classification}</div>
            </div>
            <button
              className="hud-panel-close"
              onClick={() => { resetScan(); selectionActions.deselect() }}
              aria-label="Deselect"
              type="button"
            >
              ✕
            </button>
          </div>

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

          <div className="hud-panel-divider" style={{ marginTop: '0.6rem' }} />

          {/* Scan action */}
          <div className="hud-panel-scan-action">
            <button
              className="hud-btn hud-btn--accent hud-btn--wide"
              type="button"
              onClick={() => startScan(selectedId)}
            >
              ⬡ INITIATE SCAN
            </button>
          </div>

          <p className="hud-panel-note">
            Scene data · Fictional exploration entry
          </p>
        </>
      )}
    </aside>
  )
}
