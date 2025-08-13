'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

/**
 * Error boundary specifically designed for drag-and-drop operations
 * Addresses requirement 1.4, 3.4, 3.6 for proper error handling
 */
export default class DragErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `drag-error-${Date.now()}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('DragErrorBoundary caught an error:', error, errorInfo);
    
    // Call the optional error handler
    this.props.onError?.(error, errorInfo);

    // Log specific drag-and-drop related errors
    if (error.message.includes('drag') || error.message.includes('drop')) {
      console.error('Drag-and-drop specific error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 border border-red-700/50 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h2 className="text-xl font-semibold text-red-400">
              Drag & Drop Error
            </h2>
          </div>
          
          <div className="text-center mb-6 max-w-md">
            <p className="text-slate-300 mb-2">
              {this.props.fallbackMessage || 
               'An error occurred during the drag and drop operation. This might be due to a temporary issue.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-red-300 overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Error ID: {this.state.errorId}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}