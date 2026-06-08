import * as React from 'react';

/**
 * Type declarations for the `ErrorBoundary` class component
 * (defined in `ErrorBoundary.jsx`).
 *
 * Keeps the JSX file dependency-free from TS while giving consumers
 * a clean, fully-typed API.
 */

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * React element rendered when an error is caught. The boundary will
   * inject `error` and `resetError` props automatically via
   * `React.cloneElement`.
   */
  fallback?: React.ReactElement<{
    error?: Error | null;
    resetError?: () => void;
  }>;
  /** Optional callback fired from `componentDidCatch`. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState;
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
  resetError: () => void;
  render(): React.ReactNode;
}

export default ErrorBoundary;
