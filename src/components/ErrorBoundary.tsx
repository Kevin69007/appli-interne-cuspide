
import React from 'react';
import { Button } from "@/components/ui/button";
import { trackError } from '@/utils/errorTracking';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; errorInfo: React.ErrorInfo | null; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Track the error with enhanced context
    trackError(error, {
      severity: 'critical',
      category: 'ui',
      additionalContext: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorLocation: this.getErrorLocation(error),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });

    this.setState({ errorInfo });
  }

  private getErrorLocation(error: Error): string {
    if (error.stack) {
      const lines = error.stack.split('\n');
      // Try to find the first line that contains our source code
      const relevantLine = lines.find(line => 
        line.includes('.tsx') || line.includes('.ts') || line.includes('src/')
      );
      return relevantLine || lines[1] || 'Unknown location';
    }
    return 'No stack trace available';
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} reset={this.reset} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading this page. Our team has been notified and is working on a fix.
            </p>
            <div className="space-y-3">
              <Button onClick={this.reset} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development)
                </summary>
                <div className="space-y-2">
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-xs font-medium text-red-800 mb-1">Error Message:</p>
                    <p className="text-xs text-red-700">{this.state.error.message}</p>
                  </div>
                  
                  {this.state.error.stack && (
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs font-medium text-gray-800 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-xs font-medium text-blue-800 mb-1">Component Stack:</p>
                      <pre className="text-xs text-blue-700 whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
