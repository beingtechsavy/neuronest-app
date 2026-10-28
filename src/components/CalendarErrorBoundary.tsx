'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button, Card, IconBadge } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class CalendarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#1E1F22] p-4">
          <Card className="w-full max-w-md text-center">
            <IconBadge tone="danger" size="lg" className="mx-auto mb-5">
              <AlertTriangle size={22} />
            </IconBadge>

            <h2 className="mb-2 text-xl font-bold tracking-tight text-[#F2F3F5]">
              The calendar could not load
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-[#949BA4]">
              This is usually a timezone or data problem, and it is not something you did.
              Your tasks are safe.
            </p>

            <div className="space-y-2.5">
              <Button fullWidth onClick={this.handleReset}>
                <RefreshCw size={16} aria-hidden="true" />
                Try again
              </Button>

              <Button variant="secondary" fullWidth onClick={this.handleRefresh}>
                Refresh page
              </Button>

              <Button variant="ghost" fullWidth onClick={this.handleGoHome}>
                <Home size={16} aria-hidden="true" />
                Go to dashboard
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-[#949BA4] hover:text-[#DBDEE1]">
                  Error details (development)
                </summary>
                <div className="mt-2 overflow-auto rounded-xl border border-[#3F4147] bg-[#1E1F22] p-4 text-xs text-[#FF6B6B]">
                  <div className="mb-2 font-semibold">Error:</div>
                  <div className="mb-4">{this.state.error.toString()}</div>

                  {this.state.errorInfo && (
                    <>
                      <div className="mb-2 font-semibold">Component stack:</div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for easier usage
export const withCalendarErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <CalendarErrorBoundary>
      <Component {...props} />
    </CalendarErrorBoundary>
  );

  WrappedComponent.displayName = `withCalendarErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
