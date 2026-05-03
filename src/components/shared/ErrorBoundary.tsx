'use client'

import { Component } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || ''
      const isPending = errorMsg.includes('pending') || errorMsg.includes('PreconditionFailed') || errorMsg.includes('412')

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              {isPending ? (
                <RefreshCw className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-spin" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {isPending ? 'Server is Starting Up...' : 'Something Went Wrong'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isPending
                ? 'The server is warming up. This usually takes a few seconds. Please try again.'
                : errorMsg || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
              <Button onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
