'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface OAuth2ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

interface OAuth2ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: string) => void
  resetOnPropsChange?: boolean
}

export class OAuth2ErrorBoundary extends Component<OAuth2ErrorBoundaryProps, OAuth2ErrorBoundaryState> {
  constructor(props: OAuth2ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): OAuth2ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = errorInfo.componentStack || 'No component stack available'
    
    this.setState({
      errorInfo: errorDetails
    })

    // Log error details
    console.error('OAuth2 Error Boundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorDetails)

    // Log to external error tracking service if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Google Analytics error tracking
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
      if (gtag) {
        gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            oauth2_error: true,
            component_stack: errorDetails
          }
        })
      }
    }
  }

  componentDidUpdate(prevProps: OAuth2ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError()
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError)
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-600">
                OAuth2 Error
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Something went wrong with the OAuth2 authentication process.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 font-medium">
                    {error.message || 'An unexpected error occurred'}
                  </p>
                </div>
                
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="text-left mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600">
                      Technical Details (Development)
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={this.resetError} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  If this problem persists, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return children
  }
}

/**
 * Hook version of error boundary for functional components
 */
export const useOAuth2ErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const catchError = React.useCallback((error: Error) => {
    console.error('OAuth2 Error caught by hook:', error)
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return { catchError, resetError, hasError: !!error }
}

/**
 * Higher-order component for wrapping components with OAuth2 error boundary
 */
export function withOAuth2ErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<OAuth2ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <OAuth2ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </OAuth2ErrorBoundary>
  )

  WrappedComponent.displayName = `withOAuth2ErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Specific error boundary for OAuth2 consent flows
 */
export const OAuth2ConsentErrorBoundary: React.FC<{
  children: ReactNode
  onError?: (error: Error) => void
}> = ({ children, onError }) => {
  const handleConsentError = (error: Error) => {
    console.error('OAuth2 Consent Error:', error)
    onError?.(error)
    
    // Send specific consent error analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
      if (gtag) {
        gtag('event', 'oauth2_consent_error', {
          error_message: error.message,
          error_type: 'consent_flow'
        })
      }
    }
  }

  const fallback = (error: Error, reset: () => void) => (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <CardTitle className="text-lg">Consent Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            There was an error processing your consent. This might be due to:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Invalid authorization parameters</li>
            <li>• Network connectivity issues</li>
            <li>• Server-side configuration problems</li>
          </ul>
          <div className="flex space-x-2">
            <Button onClick={reset} className="flex-1">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <OAuth2ErrorBoundary onError={handleConsentError} fallback={fallback}>
      {children}
    </OAuth2ErrorBoundary>
  )
}

/**
 * Error boundary for OAuth2 client management
 */
export const OAuth2ClientErrorBoundary: React.FC<{
  children: ReactNode
  onError?: (error: Error) => void
}> = ({ children, onError }) => {
  const handleClientError = (error: Error) => {
    console.error('OAuth2 Client Management Error:', error)
    onError?.(error)
    
    // Send specific client management error analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
      if (gtag) {
        gtag('event', 'oauth2_client_error', {
          error_message: error.message,
          error_type: 'client_management'
        })
      }
    }
  }

  return (
    <OAuth2ErrorBoundary onError={handleClientError} resetOnPropsChange>
      {children}
    </OAuth2ErrorBoundary>
  )
}
