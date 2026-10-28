'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card, IconBadge } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
              This part of the page stopped loading
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#949BA4]">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button fullWidth onClick={() => window.location.reload()}>
              <RefreshCw size={16} aria-hidden="true" />
              Reload page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
