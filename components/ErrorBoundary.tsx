"use client"
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CollaborativeEditor Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-700 font-medium">Editor Error</div>
          <div className="text-red-600 text-sm">
            {this.state.error?.message || 'Something went wrong with the collaborative editor'}
          </div>
          <textarea 
            placeholder="Fallback editor - real-time features temporarily unavailable"
            className="w-full h-96 p-4 border rounded resize-none mt-3"
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
