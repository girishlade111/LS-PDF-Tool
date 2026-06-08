'use client';

import { useEffect } from 'react';

/**
 * GlobalErrorLogger
 * ────────────────────────────────────────────────────────────────────────────
 * Registers `window.onerror` and `window.onunhandledrejection` handlers
 * that log uncaught errors and unhandled promise rejections to the
 * console. No external service is contacted.
 *
 * Mounted once in the root layout so the entire app benefits from a
 * single global error sink.
 */
export function GlobalErrorLogger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Capture uncaught errors (e.g. `throw new Error(...)` in callbacks,
    // event handlers, or top-level code that escapes the React tree).
    const handleError = (event) => {
      // eslint-disable-next-line no-console
      console.error(
        '[GlobalErrorLogger] Uncaught error:',
        event?.error || event?.message || event
      );
    };

    // Capture unhandled Promise rejections.
    const handleRejection = (event) => {
      // eslint-disable-next-line no-console
      console.error(
        '[GlobalErrorLogger] Unhandled promise rejection:',
        event?.reason || event
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Also assign `window.onerror` for environments that only fire it
    // when set as a property.
    const previousOnError = window.onerror;
    window.onerror = function globalOnError(message, source, lineno, colno, error) {
      // eslint-disable-next-line no-console
      console.error(
        '[GlobalErrorLogger] window.onerror:',
        { message, source, lineno, colno, error }
      );
      // Don't suppress — return false so other handlers (and the
      // default browser behaviour) still run.
      if (typeof previousOnError === 'function') {
        try {
          return previousOnError.call(this, message, source, lineno, colno, error);
        } catch {
          /* no-op */
        }
      }
      return false;
    };

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      // Restore previous onerror handler (don't leak the wrapper).
      if (window.onerror && window.onerror.name === 'globalOnError') {
        window.onerror = previousOnError || null;
      }
    };
  }, []);

  return null;
}

export default GlobalErrorLogger;
