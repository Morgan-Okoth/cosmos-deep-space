import { Component, type ErrorInfo, type ReactNode } from 'react'

type SceneErrorBoundaryProps = {
  children: ReactNode
  /** Optional node rendered in place of the scene if it fails to render. */
  fallback?: ReactNode
}

type SceneErrorBoundaryState = {
  hasError: boolean
}

/**
 * SceneErrorBoundary — catches render-time errors thrown by the 3D scene so
 * a WebGL failure degrades gracefully (the rest of the COSMOS shell keeps
 * rendering) instead of blanking the whole app.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[COSMOS] 3D scene render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
