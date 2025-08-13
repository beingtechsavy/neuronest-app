'use client';

import React, { Component, ReactNode } from 'react';
import { Calendar, AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'data_loading' | 'drag_drop' | 'rendering' | 'unknown';
}

/**
 * Specialized error boundary for calendar-related errors
 * Addresses requirements for comprehensive error handling in calendar operations
 */
export default class CalendarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize error type based on error message and stack
    let errorType: State['errorType'] = 'unknown';
    
    if (error.message.includes('fetch') || 
        error.message.includes('supabase') || 
        error.message.includes('network')) {
      errorType = 'data_loading';
    } else if (error.message.includes('drag') || 
               error.message.includes('drop') || 
               error.stack?.includes('dnd-kit')) {
      errorType = 'drag_drop';
    } else if (error.message.includes('render') || 
               error.stack?.includes('WeeklyView') ||
               error.stack?.includes('DayColumn')) {
      errorType = 'rendering';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CalendarErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: this.state.errorType
    });

    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown',
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorMessage(): { title: string; description: string; canRetry: boolean } {
    switch (this.state.errorType) {
      case 'data_loading':
        return {
          title: 'Failed to Load Calendar Data',
          description: 'There was an issue loading your calendar information. This might be due to a network connection problem or a temporary server issue.',
          canRetry: true
        };
      
      case 'drag_drop':
        return {
          title: 'Drag & Drop Error',
          description: 'An error occurred while moving a task. Your task data is safe, but the drag and drop functionality may need to be reset.',
          canRetry: true
        };
      
      case 'rendering':
        return {
          title: 'Calendar Display Error',
          description: 'There was an issue displaying the calendar view. This might be due to invalid task data or a temporary rendering problem.',
          canRetry: true
        };
      
      default:
        return {
          title: 'Calendar Error',
          description: 'An unexpected error occurred in the calendar. Your data is safe, but you may need to refresh the page.',
          canRetry: false
        };
    }
  }

  render() {
    if (this.state.hasError) {
      const { title, description, canRetry } = this.getErrorMessage();

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 rounded-lg shadow-2xl border border-orange-700/50 overflow-hidden">
            {/* Header */}
            <div className="bg-orange-900/20 border-b border-orange-700/50 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-full">
                  <Calendar className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-orange-400">
                    {title}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    NeuroNest Calendar
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 leading-relaxed">
                  {description}
                </p>
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
              </div>

              {/* Troubleshooting tips */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Troubleshooting Tips:
                </h3>
                <ul className="text-xs text-slate-500 space-y-1">
                  {this.state.errorType === 'data_loading' && (
                    <>
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Clear your browser cache if the problem persists</li>
                    </>
                  )}
                  {this.state.errorType === 'drag_drop' && (
                    <>
                      <li>• Try refreshing the page to reset drag functionality</li>
                      <li>• Use the task detail modal to reschedule tasks instead</li>
                      <li>• Check if the task has valid time information</li>
                    </>
                  )}
                  {this.state.errorType === 'rendering' && (
                    <>
                      <li>• Refresh the page to reload the calendar view</li>
                      <li>• Check if you have any tasks with invalid dates</li>
                      <li>• Try switching to a different view and back</li>
                    </>
                  )}
                  {this.state.errorType === 'unknown' && (
                    <>
                      <li>• Refresh the page</li>
                      <li>• Clear your browser cache</li>
                      <li>• Contact support if the problem persists</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Development info */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-slate-800/30 rounded-lg border border-slate-700">
                  <summary className="cursor-pointer p-4 text-slate-400 hover:text-slate-300 font-medium">
                    Development Details
                  </summary>
                  <div className="px-4 pb-4">
                    <pre className="text-xs text-red-300 bg-slate-900 p-3 rounded overflow-auto max-h-32">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}