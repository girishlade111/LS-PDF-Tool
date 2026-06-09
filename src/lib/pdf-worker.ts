/**
 * Centralized pdfjs-dist loader.
 *
 * Every tool that needs pdfjs-dist should call `await getPdfjs()` instead of
 * doing its own `import('pdfjs-dist')` + `GlobalWorkerOptions.workerSrc = …`.
 *
 * This module:
 *  1. Lazily imports pdfjs-dist (keeps it out of the initial bundle).
 *  2. Configures the Web Worker *once* using the matching CDN build so that PDF
 *     parsing runs off the main thread.
 *  3. Returns the same cached module on every subsequent call (no duplicate init).
 */

import type * as PdfjsLib from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof PdfjsLib> | null = null;

export function getPdfjs(): Promise<typeof PdfjsLib> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
    // Only set up the worker once.
    // Using the fake-worker (empty string) forces pdfjs to run synchronously on
    // the main thread which freezes the UI on large files.  Point it at the CDN
    // build that matches the installed package version instead.
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      // pdfjs-dist v4+ ships an ES-module worker.  We use the legacy UMD build
      // from unpkg/cdnjs because Next.js' webpack config can interfere with
      // the mjs worker entry.  The version is read from the library itself.
      const version = pdfjs.version ?? '4.9.155';
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
    }
    return pdfjs;
  });

  return pdfjsPromise;
}
