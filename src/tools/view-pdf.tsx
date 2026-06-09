'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  Loader2,
  FileText,
  Maximize,
  ArrowLeftRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { getPdfjs } from '@/lib/pdf-worker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThumbnailData {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

// ─── Zoom Presets ─────────────────────────────────────────────────────────────

const MIN_ZOOM = 25;
const MAX_ZOOM = 400;
const ZOOM_STEP = 25;
const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

// ─── Viewer Component ─────────────────────────────────────────────────────────

function PDFViewer({
  fileData,
  onExit,
}: {
  fileData: ArrayBuffer;
  onExit: () => void;
}) {
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [pageDimension, setPageDimension] = useState({ width: 0, height: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [renderingThumbnails, setRenderingThumbnails] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'custom'>('width');

  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelledRef = useRef(false);

  // ── Load PDF ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    cancelledRef.current = false;

    const loadPdf = async () => {
      try {
        const pdfjsLib = await getPdfjs();

        const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
        if (cancelled) return;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoadProgress(100);
      } catch {
        if (!cancelled) {
          setLoadProgress(-1);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [fileData]);

  // ── Render current page ──────────────────────────────────────────────────

  const renderPage = useCallback(
    async (pageNum: number, zoomLevel: number, rot: number) => {
      if (!pdfDoc) return;
      setRendering(true);

      try {
        const pdf = pdfDoc as { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number; rotation: number }) => { width: number; height: number }; render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> };
        const page = await pdf.getPage(pageNum);
        const scale = zoomLevel / 100;
        const viewport = page.getViewport({ scale, rotation: rot });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        if (cancelledRef.current) return;

        const dataUrl = canvas.toDataURL('image/png');
        setPageDataUrl(dataUrl);
        setPageDimension({ width: viewport.width, height: viewport.height });
      } catch {
        // Ignore cancelled renders
      } finally {
        if (!cancelledRef.current) {
          setRendering(false);
        }
      }
    },
    [pdfDoc]
  );

  // ── Re-render when page, zoom, or rotation changes ───────────────────────

  useEffect(() => {
    if (!pdfDoc) return;
    renderPage(currentPage, zoom, rotation);
  }, [pdfDoc, currentPage, zoom, rotation, renderPage]);

  // ── Render thumbnails ────────────────────────────────────────────────────

  useEffect(() => {
    if (!pdfDoc || thumbnails.length > 0) return;

    let cancelled = false;
    setRenderingThumbnails(true);

    const renderThumbs = async () => {
      try {
        const pdf = pdfDoc as { numPages: number; getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number }; render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> };
        const thumbs: ThumbnailData[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push({
            pageNumber: i,
            dataUrl: canvas.toDataURL('image/jpeg', 0.6),
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (!cancelled) {
          setThumbnails(thumbs);
          setRenderingThumbnails(false);
        }
      } catch {
        if (!cancelled) {
          setRenderingThumbnails(false);
        }
      }
    };

    renderThumbs();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  // ── Fit-to-width / Fit-to-page ───────────────────────────────────────────

  const fitToWidth = useCallback(() => {
    if (!pdfDoc || !viewerRef.current) return;
    const pdf = pdfDoc as { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number } }> };
    pdf.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerRef.current!.clientWidth - 48; // padding
      const newZoom = Math.round((containerWidth / viewport.width) * 100);
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
      setFitMode('width');
    });
  }, [pdfDoc, currentPage]);

  const fitToPage = useCallback(() => {
    if (!pdfDoc || !viewerRef.current) return;
    const pdf = pdfDoc as { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number } }> };
    pdf.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerRef.current!.clientWidth - 48;
      const containerHeight = viewerRef.current!.clientHeight - 48;
      const scaleW = containerWidth / viewport.width;
      const scaleH = containerHeight / viewport.height;
      const newZoom = Math.round(Math.min(scaleW, scaleH) * 100);
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
      setFitMode('page');
    });
  }, [pdfDoc, currentPage]);

  // Auto fit to width on initial load
  useEffect(() => {
    if (pdfDoc && totalPages > 0) {
      // Use a small timeout so the viewer ref has dimensions
      const timer = setTimeout(() => {
        fitToWidth();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pdfDoc, totalPages]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const goToPage = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(totalPages, page));
      setCurrentPage(p);
      setPageInputValue(String(p));
      setFitMode('custom');
    },
    [totalPages]
  );

  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);

  // ── Zoom ─────────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => {
    const nextPreset = ZOOM_PRESETS.find((z) => z > zoom);
    setZoom(nextPreset ?? Math.min(zoom + ZOOM_STEP, MAX_ZOOM));
    setFitMode('custom');
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const prevPreset = [...ZOOM_PRESETS].reverse().find((z) => z < zoom);
    setZoom(prevPreset ?? Math.max(zoom - ZOOM_STEP, MIN_ZOOM));
    setFitMode('custom');
  }, [zoom]);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setFitMode('custom');
  }, []);

  // ── Rotation ─────────────────────────────────────────────────────────────

  const rotateClockwise = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          } else {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          } else {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fitToWidth();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPage, nextPage, zoomIn, zoomOut, fitToWidth, onExit]);

  // ── Page input submit ────────────────────────────────────────────────────

  const handlePageInputSubmit = useCallback(() => {
    const num = parseInt(pageInputValue, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      goToPage(num);
    } else {
      setPageInputValue(String(currentPage));
    }
  }, [pageInputValue, totalPages, currentPage, goToPage]);

  // ── Loading state ────────────────────────────────────────────────────────

  if (loadProgress < 100 && loadProgress >= 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-sm text-muted-foreground">Loading PDF document...</p>
      </div>
    );
  }

  if (loadProgress === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">Failed to load PDF document.</p>
        <Button variant="outline" onClick={onExit}>
          Go Back
        </Button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] rounded-xl border bg-card overflow-hidden animate-in fade-in duration-300">
      {/* ─── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 border-b px-2 sm:px-4 py-2 bg-muted/30 flex-wrap">
        {/* Sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle thumbnails</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Page Navigation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous page (←)</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1.5">
          <Input
            type="text"
            value={pageInputValue}
            onChange={(e) => setPageInputValue(e.target.value)}
            onBlur={handlePageInputSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePageInputSubmit();
            }}
            className="h-8 w-12 text-center text-sm px-1"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            / {totalPages}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next page (→)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out (-)</TooltipContent>
          </Tooltip>

          {/* Zoom slider - hidden on small screens */}
          <div className="hidden md:flex items-center w-24">
            <Slider
              value={[zoom]}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              onValueChange={(v) => {
                setZoom(v[0]);
                setFitMode('custom');
              }}
              className="cursor-pointer"
            />
          </div>

          <Badge variant="outline" className="h-7 min-w-[3.5rem] justify-center text-xs font-mono cursor-pointer" onClick={resetZoom}>
            {zoom}%
          </Badge>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in (+)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Fit buttons */}
        <div className="hidden sm:flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={fitMode === 'width' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={fitToWidth}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to width (Ctrl+0)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={fitMode === 'page' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={fitToPage}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to page</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Rotate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={rotateClockwise}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rotate 90°</TooltipContent>
        </Tooltip>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Page info on mobile */}
        <span className="sm:hidden text-xs text-muted-foreground">
          {currentPage}/{totalPages}
        </span>

        {/* Exit viewer */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={onExit}
            >
              <Minimize2 className="h-3.5 w-3.5 mr-1" />
              Exit
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exit viewer (Esc)</TooltipContent>
        </Tooltip>
      </div>

      {/* ─── Content Area ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail Sidebar */}
        {sidebarOpen && (
          <div className="w-32 sm:w-40 md:w-48 border-r bg-muted/20 flex flex-col shrink-0">
            <div className="px-2 py-2 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pages
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {renderingThumbnails && thumbnails.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {thumbnails.map((thumb) => (
                  <button
                    key={thumb.pageNumber}
                    onClick={() => goToPage(thumb.pageNumber)}
                    className={`
                      w-full rounded-md border-2 overflow-hidden transition-all duration-200 hover:shadow-md group
                      ${
                        thumb.pageNumber === currentPage
                          ? 'border-cyan-500 shadow-md shadow-cyan-500/10 dark:shadow-cyan-500/20'
                          : 'border-transparent hover:border-muted-foreground/30'
                      }
                    `}
                  >
                    <div className="relative bg-white dark:bg-gray-900">
                      <img
                        src={thumb.dataUrl}
                        alt={`Page ${thumb.pageNumber}`}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                      <div
                        className={`
                          absolute bottom-0 inset-x-0 text-center text-[10px] font-medium py-0.5
                          ${
                            thumb.pageNumber === currentPage
                              ? 'bg-cyan-500 text-white'
                              : 'bg-black/50 text-white group-hover:bg-black/60'
                          }
                        `}
                      >
                        {thumb.pageNumber}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main page view */}
        <div
          ref={viewerRef}
          className="flex-1 overflow-auto bg-muted/10 dark:bg-gray-950/50"
        >
          <div className="flex items-center justify-center min-h-full p-4 sm:p-6">
            {rendering && (
              <div className="absolute z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                <span className="text-xs text-muted-foreground">Rendering...</span>
              </div>
            )}

            {pageDataUrl && (
              <div
                className="relative shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-sm transition-transform duration-200"
                style={{
                  maxWidth: '100%',
                  overflow: 'auto',
                }}
              >
                <img
                  src={pageDataUrl}
                  alt={`Page ${currentPage}`}
                  className="block max-w-full h-auto"
                  style={{
                    width: pageDimension.width ? `${pageDimension.width}px` : undefined,
                    height: pageDimension.height ? `${pageDimension.height}px` : undefined,
                    maxWidth: 'none',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Status Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          {rotation !== 0 && <span>Rotated {rotation}°</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            {pageDimension.width} × {pageDimension.height} px
          </span>
          <span>{zoom}% zoom</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tool Component ──────────────────────────────────────────────────────

export function ViewPDFTool() {
  const { files } = useFileStore();
  const [viewMode, setViewMode] = useState(false);

  const handleViewPDF = () => {
    if (files.length === 0) return;
    setViewMode(true);
  };

  const handleExitViewer = () => {
    setViewMode(false);
  };

  // If in view mode, show the full PDF viewer
  if (viewMode && files.length > 0) {
    return (
      <div className="space-y-4 animate-page-enter">
        {/* Breadcrumb-style header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4 text-cyan-500" />
            <span className="font-medium text-foreground">PDF Viewer</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="truncate max-w-[200px]">{files[0].name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExitViewer}>
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            Back to Upload
          </Button>
        </div>

        <PDFViewer fileData={files[0].data} onExit={handleExitViewer} />
      </div>
    );
  }

  // Normal upload mode using ToolPage wrapper
  return (
    <ToolPage
      toolId="view-pdf"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleViewPDF}
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
          disabled={files.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          View PDF
        </Button>
      }
    >
      <div className="rounded-xl border bg-gradient-to-br from-cyan-50/50 to-teal-50/30 dark:from-cyan-950/20 dark:to-teal-950/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/40 shrink-0">
            <Eye className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              PDF Viewer with Zoom & Pan
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload a PDF to view it with full page navigation, zoom controls (25%–400%), and
              a thumbnail sidebar. Use keyboard shortcuts for quick navigation.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="outline" className="text-[10px] h-5">
                ← → Navigate
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                + / - Zoom
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                Ctrl+0 Fit width
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                Esc Exit
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
