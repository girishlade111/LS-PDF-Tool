'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { rearrangePDFPages } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, RotateCcw, Info, FileText } from 'lucide-react';

interface PageThumbnail {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function RearrangePDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const totalPages = useMemo(() => {
    if (files.length > 0 && files[0].pageCount) {
      return files[0].pageCount;
    }
    return 0;
  }, [files]);

  // Reset when files change
  const currentFileId = files.length > 0 ? files[0].id : '';
  if (currentFileId && !initialized) {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i));
    setInitialized(true);
  }
  if (!currentFileId && initialized) {
    setInitialized(false);
    setPageOrder([]);
    setThumbnails([]);
  }

  // Render thumbnails using pdfjs-dist
  useEffect(() => {
    if (files.length === 0 || totalPages === 0) {
      setThumbnails([]);
      return;
    }

    let cancelled = false;
    setLoadingThumbnails(true);

    async function renderThumbnails() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';

        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(files[0].data) }).promise;
        const rendered: PageThumbnail[] = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

          const origViewport = page.getViewport({ scale: 1 });
          rendered.push({
            pageNum: i,
            dataUrl,
            width: Math.round(origViewport.width),
            height: Math.round(origViewport.height),
          });
        }

        if (!cancelled) {
          setThumbnails(rendered);
          setLoadingThumbnails(false);
        }
      } catch {
        if (!cancelled) {
          setLoadingThumbnails(false);
        }
      }
    }

    renderThumbnails();
    return () => { cancelled = true; };
  }, [files, totalPages]);

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    setPageOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index > 0) movePage(index, index - 1);
  }, [movePage]);

  const moveDown = useCallback((index: number) => {
    if (index < pageOrder.length - 1) movePage(index, index + 1);
  }, [movePage, pageOrder.length]);

  const moveToTop = useCallback((index: number) => {
    if (index > 0) movePage(index, 0);
  }, [movePage]);

  const moveToBottom = useCallback((index: number) => {
    if (index < pageOrder.length - 1) movePage(index, pageOrder.length - 1);
  }, [movePage, pageOrder.length]);

  const resetOrder = useCallback(() => {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i));
  }, [totalPages]);

  const reverseOrder = useCallback(() => {
    setPageOrder((prev) => [...prev].reverse());
  }, []);

  const isOriginalOrder = useMemo(() => {
    return pageOrder.every((val, idx) => val === idx);
  }, [pageOrder]);

  const handleRearrange = async () => {
    if (files.length === 0 || pageOrder.length === 0) return;
    if (isOriginalOrder) {
      setError('Page order is already the same as the original. Rearrange pages first.');
      return;
    }
    try {
      setProcessing('Rearranging PDF pages...');
      setProgress(30, 'Reading document...');

      const result = await rearrangePDFPages(files[0].data, pageOrder);

      setProgress(80, 'Creating rearranged file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `rearranged-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rearrange PDF pages');
    }
  };

  return (
    <ToolPage
      toolId="rearrange"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleRearrange}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || pageOrder.length < 2 || isOriginalOrder}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Rearrange Pages
        </Button>
      }
    >
      {files.length > 0 && totalPages > 0 && (
        <div className="space-y-4">
          {/* Info card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Use the arrow buttons on each page to reorder them. You can also &quot;Move to Top&quot; or &quot;Move to Bottom&quot; for quick repositioning.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetOrder}
              disabled={isOriginalOrder}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={reverseOrder}
              disabled={totalPages < 2}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              Reverse All
            </Button>
            <Badge variant="secondary" className="ml-auto">
              {totalPages} page{totalPages !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Page grid with thumbnails */}
          {loadingThumbnails ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600 dark:border-cyan-800 dark:border-t-cyan-400" />
                  <p className="text-sm text-muted-foreground">Loading page thumbnails...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
              {pageOrder.map((originalPageIdx, currentIdx) => {
                const thumbnail = thumbnails[originalPageIdx];
                return (
                  <div
                    key={originalPageIdx}
                    className="flex flex-col rounded-xl border-2 border-muted bg-card overflow-hidden transition-all duration-150 hover:border-cyan-300 dark:hover:border-cyan-700"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail.dataUrl}
                          alt={`Page ${originalPageIdx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                      )}
                      {/* Position badge */}
                      <div className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white text-xs font-bold">
                        {currentIdx + 1}
                      </div>
                    </div>

                    {/* Page info */}
                    <div className="p-2 space-y-1">
                      <div className="text-xs text-center font-medium">
                        Page {originalPageIdx + 1}
                      </div>
                      {thumbnail && (
                        <div className="text-[10px] text-center text-muted-foreground">
                          {thumbnail.width} × {thumbnail.height} pt
                        </div>
                      )}

                      {/* Reorder buttons */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveToTop(currentIdx)}
                          disabled={currentIdx === 0}
                          className="p-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move to top"
                          aria-label="Move to top"
                        >
                          <ChevronsUp className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        </button>
                        <button
                          onClick={() => moveUp(currentIdx)}
                          disabled={currentIdx === 0}
                          className="p-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        </button>
                        <button
                          onClick={() => moveDown(currentIdx)}
                          disabled={currentIdx === pageOrder.length - 1}
                          className="p-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        </button>
                        <button
                          onClick={() => moveToBottom(currentIdx)}
                          disabled={currentIdx === pageOrder.length - 1}
                          className="p-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move to bottom"
                          aria-label="Move to bottom"
                        >
                          <ChevronsDown className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New page order display */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-cyan-500" />
              New Page Order
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {pageOrder.map((originalIdx, currentIdx) => (
                <React.Fragment key={currentIdx}>
                  <Badge
                    variant={originalIdx !== currentIdx ? 'default' : 'secondary'}
                    className={
                      originalIdx !== currentIdx
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        : ''
                    }
                  >
                    {originalIdx + 1}
                  </Badge>
                  {currentIdx < pageOrder.length - 1 && (
                    <span className="text-muted-foreground text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              New order: {pageOrder.map((i) => i + 1).join(', ')}
            </p>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
