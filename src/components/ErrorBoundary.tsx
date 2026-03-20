'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="text-center max-w-sm space-y-4">
            <div className="mx-auto w-12 h-12 rounded-lg bg-(--error)/10 border border-(--error)/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-(--error)" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Component Error</h3>
              <p className="text-xs text-[#888]">
                This section encountered an error and couldn&apos;t render.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
