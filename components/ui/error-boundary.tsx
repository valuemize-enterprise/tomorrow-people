"use client"

import { Component, type ReactNode } from "react"

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

/**
 * Client-side error boundary.
 * Wraps sections of the dashboard that could fail independently
 * so a broken score card doesn't take down the entire /today page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <DailyScoreCard ... />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<p>Score unavailable</p>}>
 *     <DailyScoreCard ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  componentDidCatch(err: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", err, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          role="alert"
          className="rounded-[var(--radius-lg)] border border-[var(--surface-3)] bg-[var(--surface-2)] px-4 py-3"
        >
          <p className="t-small text-[var(--ink-tertiary)]">
            This section couldn't load. Refresh to try again.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
