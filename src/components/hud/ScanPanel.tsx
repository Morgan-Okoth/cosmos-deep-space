import { useScanStore, scanActions } from '../../store/scanStore'
import { useScan } from '../../hooks/useScan'
import { SCAN_PROFILES, SCAN_MILESTONES } from '../../systems/scanData'
import { ScanProgressBar } from './ScanProgressBar'
import { useSelectionStore } from '../../store/selectionStore'

/**
 * ScanPanel — the scan results panel.
 *
 * Renders in three visual modes:
 *
 *   idle      → "INITIATE SCAN" button (shown inside InfoPanel, not here)
 *   scanning  → progress bar + progressively revealed category rows +
 *               current milestone message
 *   complete  → all results visible + "SCAN AGAIN" button
 *
 * This panel is shown INSTEAD of the standard InfoPanel attribute list
 * when a scan is active or complete for the currently selected body.
 */
export function ScanPanel() {
  const phase         = useScanStore((s) => s.phase)
  const progress      = useScanStore((s) => s.progress)
  const revealedCount = useScanStore((s) => s.revealedCount)
  const targetId      = useScanStore((s) => s.targetId)
  const selectedId    = useSelectionStore((s) => s.selectedId)

  const { startScan, resetScan } = useScan()

  if (phase === 'idle') return null
  if (targetId !== selectedId) return null    // stale scan from prior selection

  const profile = targetId ? SCAN_PROFILES[targetId] : null
  if (!profile) return null

  // Find current milestone message
  const milestone = [...SCAN_MILESTONES]
    .reverse()
    .find((m) => progress >= m.threshold)
  const milestoneMsg = milestone?.message ?? 'Initiating scan…'

  return (
    <div className="scan-panel">
      {/* Header */}
      <div className="scan-panel-header">
        <div className="scan-panel-eyebrow">DEEP SPACE SCANNER</div>
        <h2 className="scan-panel-title">{profile.name}</h2>
        <div
          className={`scan-panel-status scan-panel-status--${phase}`}
        >
          {phase === 'scanning' ? '● SCANNING' : '✓ COMPLETE'}
        </div>
      </div>

      <div className="scan-panel-divider" />

      {/* Progress bar (scanning only) */}
      {phase === 'scanning' && (
        <div className="scan-panel-progress-wrap">
          <ScanProgressBar progress={progress} />
          <p className="scan-panel-milestone">{milestoneMsg}</p>
        </div>
      )}

      {/* Category rows — revealed progressively */}
      <div className="scan-panel-categories">
        {profile.categories.map((cat, catIndex) => {
          const revealed = catIndex < revealedCount
          if (!revealed) return null
          return (
            <div
              key={cat.title}
              className="scan-category"
              style={{ animationDelay: `${catIndex * 60}ms` }}
            >
              <div className="scan-category-title">{cat.title}</div>
              <dl className="scan-category-rows">
                {cat.results.map((r) => (
                  <div key={r.label} className="scan-row">
                    <dt className="scan-row-label">{r.label}</dt>
                    <dd className="scan-row-value">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="scan-panel-footer">
        <p className="scan-panel-note">
          Fictional COSMOS exploration data — not real measurements
        </p>
        <div className="scan-panel-actions">
          {phase === 'complete' && selectedId && (
            <button
              className="hud-btn hud-btn--accent"
              type="button"
              onClick={() => { resetScan(); startScan(selectedId) }}
            >
              SCAN AGAIN
            </button>
          )}
          <button
            className="hud-btn"
            type="button"
            onClick={() => { resetScan(); scanActions.reset() }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
