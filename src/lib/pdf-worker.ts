/**
 * Centralized pdfjs-dist loader.
 *
 * Every tool that needs pdfjs-dist should call `await getPdfjs()` instead of
 * doing its own `import('pdfjs-dist')` + `GlobalWorkerOptions.workerSrc = …`.
 *
 * This module:
 *  1. Lazily imports pdfjs-dist (keeps it out of the initial bundle).
 *  2. Configures the Web Worker *once* from a static same-origin asset
 *     (`public/pdf.worker.min.mjs`) so PDF parsing runs off the main thread.
 *  3. Returns the same cached module on every subsequent call (no duplicate init).
 *
 * NOTE: `public/pdf.worker.min.mjs` is a copy of
 * `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`. If you bump the
 * pdfjs-dist version, re-copy that file so the worker matches the library.
 */

import type * as PdfjsLib from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof PdfjsLib> | null = null;

export function getPdfjs(): Promise<typeof PdfjsLib> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
    // Only set up the worker once.
    // Using the fake-worker (empty string) forces pdfjs to run synchronously on
    // the main thread which freezes the UI on large files.  We serve the worker
    // as a static same-origin asset from `public/pdf.worker.min.mjs` (copied
    // from node_modules/pdfjs-dist/build at the matching version). This avoids
    // both the unreliable CDN fetch and any bundler module-resolution quirks.
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    return pdfjs;
  });

  return pdfjsPromise;
}
