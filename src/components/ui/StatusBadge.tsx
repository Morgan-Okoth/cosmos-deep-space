/**
 * StatusBadge — small system-status readout for the starter screen.
 */
export function StatusBadge() {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-accent/5 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-accent">
      <span className="status-dot" />
      <span>System Initialized</span>
    </div>
  )
}
