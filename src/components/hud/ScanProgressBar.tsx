/**
 * ScanProgressBar — animated horizontal progress bar.
 * The filled portion transitions via CSS width, so it's smooth without
 * any per-frame React re-renders (the width only updates when the scan
 * store notifies subscribers, which happens ~30× / s during scanning).
 */

type ScanProgressBarProps = {
  progress: number   // 0–100
}

export function ScanProgressBar({ progress }: ScanProgressBarProps) {
  return (
    <div className="scan-progress-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="scan-progress-fill"
        style={{ width: `${progress}%` }}
      />
      <div className="scan-progress-label">
        {Math.round(progress)}%
      </div>
    </div>
  )
}
