'use client'
import React from 'react'
import { AlertCircle } from 'lucide-react'

interface Props { children: React.ReactNode; fallback?: React.ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
