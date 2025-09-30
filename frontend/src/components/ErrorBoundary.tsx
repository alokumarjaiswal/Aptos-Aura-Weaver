import React, { Component, ErrorInfo, ReactNode } from 'react';
import { analytics } from '../utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Track error for analytics
    analytics.trackError(error, 'error_boundary');
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>🚫 Something went wrong</h2>
            <p>
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.message}</pre>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleRetry} 
                className="btn btn-primary"
                aria-label="Try again"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload} 
                className="btn btn-secondary"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>

            <div className="error-help">
              <p>If this problem persists:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Try using a different browser</li>
                <li>Ensure your wallet extension is up to date</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;