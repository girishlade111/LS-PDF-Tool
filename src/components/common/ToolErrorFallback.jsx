import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * ToolErrorFallback
 * ────────────────────────────────────────────────────────────────────────────
 * Calm, helpful fallback UI shown when a tool page throws an uncaught error.
 * Designed to be used as the `fallback` prop of an `ErrorBoundary`:
 *
 *     <ErrorBoundary
 *       key={location.pathname}
 *       fallback={<ToolErrorFallback />}
 *     >
 *       <Tool />
 *     </ErrorBoundary>
 *
 * The parent `ErrorBoundary` injects `error` and `resetError` props via
 * `React.cloneElement`, so this component reads them directly.
 *
 * Props
 * ─────
 * - `error`      (Error)        — The error that was caught.
 * - `resetError` (function)     — Call to clear the boundary and re-mount the tool.
 *
 * Design goals
 * ────────────
 * - Don't panic the user — friendly, calm copy.
 * - Show the technical message in a small gray code block for debuggability,
 *   but keep the primary language reassuring.
 * - Two recovery paths: "Try Again" (re-mount) and "Back to Home" (return to
 *   the safe landing page).
 */
export function ToolErrorFallback({ error, resetError }) {
  const errorMessage =
    (error && (error.message || error.toString())) ||
    'An unexpected error occurred. Please try again.';

  const handleGoHome = () => {
    // Clear the hash route so the app falls back to the home page.
    if (typeof window !== 'undefined') {
      try {
        window.location.hash = '';
      } catch {
        /* no-op */
      }
      // Reload to fully reset client state (matches existing nav behavior).
      try {
        window.location.reload();
      } catch {
        /* no-op */
      }
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16"
    >
      <div className="rounded-2xl border bg-card shadow-sm p-6 sm:p-10 text-center">
        {/* Red warning icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <AlertTriangle
            className="h-7 w-7 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Something went wrong
        </h2>

        {/* Reassuring subheading */}
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
          Don't worry — your files are safe. This tool ran into an unexpected
          problem. You can try again, or head back home and pick a different
          tool.
        </p>

        {/* Error details in a gray code box */}
        <div className="mt-6 mx-auto max-w-md">
          <div className="rounded-md border bg-muted/60 dark:bg-muted/30 px-3 py-2.5 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">
              Error details
            </p>
            <code className="block text-xs font-mono text-muted-foreground break-words whitespace-pre-wrap">
              {errorMessage}
            </code>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof resetError === 'function') {
                resetError();
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-sm font-medium px-5 py-2.5 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium px-5 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </button>
        </div>

        {/* Quiet reassurance footer */}
        <p className="mt-6 text-[11px] text-muted-foreground/70">
          No data has been lost. Everything is still running locally in your
          browser.
        </p>
      </div>
    </div>
  );
}

export default ToolErrorFallback;
