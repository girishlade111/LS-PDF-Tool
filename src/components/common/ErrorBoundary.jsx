import React from 'react';

/**
 * ErrorBoundary
 * ────────────────────────────────────────────────────────────────────────────
 * A reusable React error boundary (class component — required for error
 * boundaries in React). Catches any uncaught JavaScript errors thrown by
 * its child component tree and renders a fallback UI instead of letting
 * the entire app crash.
 *
 * Props
 * ─────
 * - `fallback`  (React element) — UI rendered when an error is caught.
 *                 The element receives `error` and `resetError` props
 *                 automatically (see `cloneElement` below) so fallback
 *                 components like `ToolErrorFallback` can be used directly.
 * - `onError`   (function)      — Optional callback fired from
 *                 `componentDidCatch`. Receives `(error, errorInfo)`.
 * - `children`  (ReactNode)     — The subtree to guard.
 *
 * Notes
 * ─────
 * - The boundary's `key` prop (set by the parent, typically
 *   `location.pathname`) will remount this component on route change,
 *   which clears the error state.
 * - Pair with `ToolErrorFallback` for a calm, helpful tool-crash UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console only — no external error-reporting service.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] onError callback threw:', callbackError);
      }
    }
  }

  /**
   * Reset the boundary so children are re-mounted and re-rendered.
   * Pass this down to the fallback UI (e.g. as `resetError`).
   */
  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback) {
        // Inject `error` + `resetError` into the provided fallback element so
        // consumers can use a clean API: <ErrorBoundary fallback={<MyUI />}>.
        return React.cloneElement(fallback, {
          error,
          resetError: this.resetError,
        });
      }

      // Default fallback (keeps the app running even without a custom one).
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center"
        >
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.resetError}
            className="mt-2 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
