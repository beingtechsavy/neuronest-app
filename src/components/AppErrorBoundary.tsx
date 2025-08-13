'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { ErrorBoundaryUtils, handleError, ErrorContext } from '../lib/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Application-wide error boundary with comprehensive error handling
 * Addresses requirements 1.4, 3.4, 3.6, 4.5, 4.7 for proper error handling
 */
export default class AppErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `app-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    const context: ErrorContext = {
      operation: 'app_error_boundary',
      timestamp: new Date(),
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'AppErrorBoundary',
        retryCount: this.state.retryCount
      }
    };

    // Handle error using comprehensive error handler
    const errorResult = handleError(error, context, errorInfo);
    
    // Log error details
    console.error('AppErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      canRetry: errorResult.canRetry,
      userMessage: errorResult.userMessage
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, context);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo, context: ErrorContext) => {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    };

    console.log('Error report (would be sent to error service):', errorReport);
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: '',
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => console.log('Failed to copy error details'));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRecoverable = ErrorBoundaryUtils.isRecoverable(this.state.error);
      const userMessage = ErrorBoundaryUtils.generateUserMessage(this.state.error);
      const canRetry = isRecoverable && this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-lg shadow-2xl border border-red-700/50 overflow-hidden">
            {/* Header */}
            <div className="bg-red-900/20 border-b border-red-700/50 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-red-400">
                    Something went wrong
                  </h1>
                  <p className="text-slate-400 mt-1">
                    NeuroNest encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User-friendly message */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 leading-relaxed">
                  {userMessage}
                </p>
                {this.state.retryCount > 0 && (
                  <p className="text-slate-400 text-sm mt-2">
                    Retry attempt: {this.state.retryCount} of {this.maxRetries}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={this.handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>

                {(this.props.showDetails || process.env.NODE_ENV === 'development') && (
                  <button
                    onClick={this.copyErrorDetails}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-medium"
                  >
                    <Bug className="w-4 h-4" />
                    Copy Error Details
                  </button>
                )}
              </div>

              {/* Technical details (development only or if showDetails is true) */}
              {(this.props.showDetails || process.env.NODE_ENV === 'development') && (
                <details className="bg-slate-800/30 rounded-lg border border-slate-700">
                  <summary className="cursor-pointer p-4 text-slate-400 hover:text-slate-300 font-medium">
                    Technical Details
                  </summary>
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Error ID:</h4>
                      <code className="text-xs text-red-300 bg-slate-900 px-2 py-1 rounded">
                        {this.state.errorId}
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Error Message:</h4>
                      <pre className="text-xs text-red-300 bg-slate-900 p-3 rounded overflow-auto max-h-32">
                        {this.state.error.message}
                      </pre>
                    </div>

                    {this.state.error.stack && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-1">Stack Trace:</h4>
                        <pre className="text-xs text-slate-400 bg-slate-900 p-3 rounded overflow-auto max-h-48">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-1">Component Stack:</h4>
                        <pre className="text-xs text-slate-400 bg-slate-900 p-3 rounded overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help text */}
              <div className="text-center text-sm text-slate-500">
                <p>
                  If this problem persists, please contact support with the error ID above.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="mt-1">
                    Development mode: Check the console for additional details.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}