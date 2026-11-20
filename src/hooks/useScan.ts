/**
 * useScan — drives the scan progress from 0 → 100 over SCAN_DURATION_MS.
 *
 * Uses requestAnimationFrame (not React state, not useFrame) so it runs
 * independently of the R3F render loop and doesn't cause re-renders via
 * setState — the scan store notifies subscribers directly.
 *
 * Rules:
 *  - If the selected target changes while scanning, the scan is aborted.
 *  - Calling startScan while already scanning the same target is a no-op.
 *  - The rAF loop is cleaned up on component unmount or scan abort.
 */
import { useEffect, useRef } from 'react'
import { scanActions, getScanSnapshot } from '../store/scanStore'
import { useSelectionStore }             from '../store/selectionStore'
import { SCAN_DURATION_MS, SCAN_PROFILES } from '../systems/scanData'
import type { CelestialId } from '../store/selectionStore'

export function useScan() {
  const selectedId   = useSelectionStore((s) => s.selectedId)
  const rafRef       = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // If target changes while scanning, abort immediately
  useEffect(() => {
    const snap = getScanSnapshot()
    if (snap.phase === 'scanning' && snap.targetId !== selectedId) {
      scanActions.reset()
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current   = null
        startTimeRef.current = null
      }
    }
  }, [selectedId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function startScan(targetId: CelestialId) {
    const snap = getScanSnapshot()
    // Idempotent — don't restart if already scanning the same target
    if (snap.phase === 'scanning' && snap.targetId === targetId) return

    // Cancel any in-flight scan
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current   = null
      startTimeRef.current = null
    }

    scanActions.start(targetId)
    startTimeRef.current = null   // set on first rAF tick

    const profile = SCAN_PROFILES[targetId]
    if (!profile) { scanActions.complete(); return }

    function tick(now: number) {
      if (startTimeRef.current === null) startTimeRef.current = now

      const elapsed  = now - startTimeRef.current
      const progress = Math.min((elapsed / SCAN_DURATION_MS) * 100, 100)

      // Count how many categories have crossed their threshold
      const revealedCount = profile.categories.filter(
        (c) => progress >= c.threshold,
      ).length

      if (progress >= 100) {
        scanActions.complete()
        rafRef.current   = null
        startTimeRef.current = null
        return
      }

      scanActions.setProgress(progress, revealedCount)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  function resetScan() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current   = null
      startTimeRef.current = null
    }
    scanActions.reset()
  }

  return { startScan, resetScan }
}
