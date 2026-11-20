import { useEffect, useRef, useState } from 'react'
import { useIntroStore, introActions } from '../../store/introStore'

/**
 * IntroOverlay — the cinematic title screen rendered as a DOM layer above
 * the 3D canvas.
 *
 * Layout (all pointer-events-none except the two action buttons):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │                                              │
 *   │                                              │
 *   │             C O S M O S                      │  ← title, fades in at 1.8s
 *   │         EXPLORE THE UNKNOWN                  │  ← subtitle, fades in at 2.6s
 *   │                                              │
 *   │          [ ENTER COSMOS ]                    │  ← primary CTA, fades in at 3.5s
 *   │             SKIP INTRO                       │  ← secondary, fades in at 3.8s
 *   │                                              │
 *   └──────────────────────────────────────────────┘
 *
 * During the 'entering' phase the entire overlay fades out over 800ms, after
 * which completeEntry() is called to switch to 'active'.
 *
 * Animation is entirely CSS — no per-frame JS.
 */
export function IntroOverlay() {
  const phase = useIntroStore((s) => s.phase)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When entering phase starts: fade out, then complete
  useEffect(() => {
    if (phase === 'entering') {
      timerRef.current = setTimeout(() => {
        introActions.completeEntry()
      }, 850) // matches CSS transition duration below
    }
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [phase])

  // Keep overlay mounted until 'active' so the fade-out is visible
  useEffect(() => {
    if (phase === 'active') setVisible(false)
  }, [phase])

  if (!visible) return null

  const isExiting = phase === 'entering'

  return (
    <div
      aria-label="COSMOS intro screen"
      className="intro-overlay"
      data-exiting={isExiting ? 'true' : undefined}
    >
      {/* Skip button — top right */}
      <button
        className="intro-skip"
        onClick={introActions.skipIntro}
        aria-label="Skip intro"
        type="button"
      >
        SKIP INTRO
      </button>

      {/* Centre content */}
      <div className="intro-centre">
        <div className="intro-eyebrow">DEEP-SPACE EXPLORATION</div>

        <h1 className="intro-title">
          {'COSMOS'.split('').map((ch, i) => (
            <span key={i} className="intro-title-char" style={{ animationDelay: `${1.6 + i * 0.08}s` }}>
              {ch}
            </span>
          ))}
        </h1>

        <p className="intro-subtitle">EXPLORE THE UNKNOWN</p>

        <div className="intro-divider" />

        <div className="intro-actions">
          <button
            className="intro-enter-btn"
            onClick={introActions.enterCosmos}
            type="button"
            autoFocus
          >
            ENTER COSMOS
          </button>
        </div>
      </div>

      {/* Bottom attribution line */}
      <div className="intro-footer">
        <span className="intro-footer-text">SYSTEM INITIALIZED</span>
        <span className="intro-footer-dot" />
      </div>
    </div>
  )
}
