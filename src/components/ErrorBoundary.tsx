// Global Error Boundary Component
// Catches React errors and provides fallback UI with logging

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

// Error logging service
class ErrorLogger {
  private static instance: ErrorLogger;
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  // Log error to console and potentially external service
  logError(error: Error, errorInfo?: ErrorInfo, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const errorReport = {
      timestamp,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context,
    };
    
    // Console logging
    console.error('🚨 Error Boundary caught an error:', errorReport);
    
    // Store in sessionStorage for debugging
    try {
      const key = `error_${timestamp}`;
      sessionStorage.setItem(key, JSON.stringify(errorReport));
      
      // Keep only last 10 errors
      const errorKeys = Object.keys(sessionStorage)
        .filter(k => k.startsWith('error_'))
        .sort()
        .reverse();
      
      errorKeys.slice(10).forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      // Ignore storage errors
    }
    
    // Send to external logging service (if configured)
    this.sendToLoggingService(errorReport);
  }
  
  private async sendToLoggingService(errorReport: {
    timestamp: string;
    message: string;
    stack?: string;
    componentStack?: string;
    userAgent: string;
    url: string;
    context?: Record<string, unknown>;
  }) {
    // Placeholder for external logging service integration
    // Could integrate with Sentry, LogRocket, etc.
    
    if (process.env.NODE_ENV === 'production' && process.env.VITE_ERROR_LOGGING_ENDPOINT) {
      try {
        await fetch(process.env.VITE_ERROR_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport),
          keepalive: true,
        });
      } catch (e) {
        // Silent fail
      }
    }
  }
  
  // Get recent errors from sessionStorage
  getRecentErrors(): Array<{
    timestamp: string;
    message: string;
    stack?: string;
    componentStack?: string;
    userAgent: string;
    url: string;
    context?: Record<string, unknown>;
  }> {
    const errors: Array<{
      timestamp: string;
      message: string;
      stack?: string;
      componentStack?: string;
      userAgent: string;
      url: string;
      context?: Record<string, unknown>;
    }> = [];
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('error_')) {
          const value = sessionStorage.getItem(key);
          if (value) {
            errors.push(JSON.parse(value));
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return errors.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Default fallback UI
const DefaultErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}> = ({ error, errorInfo, resetError }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. We've logged the issue and are working on it.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Error Details (Development Only):</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-mono text-destructive">{error.message}</p>
                {error.stack && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Stack Trace</summary>
                    <pre className="mt-2 overflow-auto">{error.stack}</pre>
                  </details>
                )}
                {errorInfo?.componentStack && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Component Stack</summary>
                    <pre className="mt-2 overflow-auto">{errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 flex-wrap">
            <Button onClick={resetError} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Error ID: {new Date().getTime().toString(36)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Error Boundary Component
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    errorLogger.logError(error, errorInfo, {
      errorCount: this.state.errorCount + 1,
    });
    
    // Call optional onError callback
    this.props.onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
  }
  
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Use default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }
    
    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for manually reporting errors
export function useErrorReporting() {
  const reportError = (error: Error, context?: Record<string, unknown>) => {
    errorLogger.logError(error, undefined, context);
  };
  
  return { reportError };
}
