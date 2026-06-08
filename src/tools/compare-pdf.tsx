'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { comparePDFs, formatFileSize } from '@/lib/pdf-utils';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, GitCompare, CheckCircle2, XCircle, ArrowRight, Info, FileText, Layers, Ruler, Clock, User, Monitor, Printer, BookOpen } from 'lucide-react';

interface ComparisonResult {
  file1: {
    name: string;
    size: number;
    pageCount: number;
    dimensions: Array<{ width: number; height: number }>;
    metadata: {
      title: string | undefined;
      author: string | undefined;
      subject: string | undefined;
      keywords: string[] | undefined;
      creator: string | undefined;
      producer: string | undefined;
      creationDate: Date | undefined;
      modificationDate: Date | undefined;
    };
  };
  file2: {
    name: string;
    size: number;
    pageCount: number;
    dimensions: Array<{ width: number; height: number }>;
    metadata: {
      title: string | undefined;
      author: string | undefined;
      subject: string | undefined;
      keywords: string[] | undefined;
      creator: string | undefined;
      producer: string | undefined;
      creationDate: Date | undefined;
      modificationDate: Date | undefined;
    };
  };
}

function formatPtToInches(pt: number): string {
  return (pt / 72).toFixed(2);
}

function formatDate(date: Date | undefined): string {
  if (!date) return '—';
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatKeywords(keywords: string[] | undefined): string {
  if (!keywords || keywords.length === 0) return '—';
  return keywords.join(', ');
}

function valuesMatch(v1: string, v2: string): boolean {
  if (v1 === '—' && v2 === '—') return true;
  return v1 === v2;
}

interface ComparisonRow {
  label: string;
  icon: React.ElementType;
  value1: string;
  value2: string;
}

export function ComparePDFTool() {
  const { files } = useFileStore();
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runComparison = useCallback(async () => {
    if (files.length !== 2) {
      setComparison(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await comparePDFs(files[0].data, files[1].data);
      setComparison({
        file1: {
          name: files[0].name,
          size: files[0].size,
          pageCount: result.file1.pageCount,
          dimensions: result.file1.dimensions,
          metadata: result.file1.metadata,
        },
        file2: {
          name: files[1].name,
          size: files[1].size,
          pageCount: result.file2.pageCount,
          dimensions: result.file2.dimensions,
          metadata: result.file2.metadata,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare PDFs');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [files]);

  useEffect(() => {
    if (files.length === 2) {
      runComparison();
    } else {
      setComparison(null);
      setError(null);
    }
  }, [files.length, runComparison]);

  // Build comparison rows
  const comparisonRows: ComparisonRow[] = comparison
    ? [
        {
          label: 'File Name',
          icon: FileText,
          value1: comparison.file1.name,
          value2: comparison.file2.name,
        },
        {
          label: 'File Size',
          icon: Layers,
          value1: formatFileSize(comparison.file1.size),
          value2: formatFileSize(comparison.file2.size),
        },
        {
          label: 'Page Count',
          icon: FileText,
          value1: String(comparison.file1.pageCount),
          value2: String(comparison.file2.pageCount),
        },
        {
          label: 'First Page Size',
          icon: Ruler,
          value1: comparison.file1.dimensions.length > 0
            ? `${comparison.file1.dimensions[0].width.toFixed(1)} × ${comparison.file1.dimensions[0].height.toFixed(1)} pt (${formatPtToInches(comparison.file1.dimensions[0].width)} × ${formatPtToInches(comparison.file1.dimensions[0].height)} in)`
            : '—',
          value2: comparison.file2.dimensions.length > 0
            ? `${comparison.file2.dimensions[0].width.toFixed(1)} × ${comparison.file2.dimensions[0].height.toFixed(1)} pt (${formatPtToInches(comparison.file2.dimensions[0].width)} × ${formatPtToInches(comparison.file2.dimensions[0].height)} in)`
            : '—',
        },
        {
          label: 'Title',
          icon: BookOpen,
          value1: comparison.file1.metadata.title || '—',
          value2: comparison.file2.metadata.title || '—',
        },
        {
          label: 'Author',
          icon: User,
          value1: comparison.file1.metadata.author || '—',
          value2: comparison.file2.metadata.author || '—',
        },
        {
          label: 'Creator',
          icon: Monitor,
          value1: comparison.file1.metadata.creator || '—',
          value2: comparison.file2.metadata.creator || '—',
        },
        {
          label: 'Producer',
          icon: Printer,
          value1: comparison.file1.metadata.producer || '—',
          value2: comparison.file2.metadata.producer || '—',
        },
        {
          label: 'Creation Date',
          icon: Clock,
          value1: formatDate(comparison.file1.metadata.creationDate),
          value2: formatDate(comparison.file2.metadata.creationDate),
        },
        {
          label: 'Modification Date',
          icon: Clock,
          value1: formatDate(comparison.file1.metadata.modificationDate),
          value2: formatDate(comparison.file2.metadata.modificationDate),
        },
      ]
    : [];

  // Count differences
  const differenceCount = comparison
    ? comparisonRows.filter((row) => !valuesMatch(row.value1, row.value2)).length
    : 0;

  // Page-by-page dimensions comparison
  const pageDimsMatch = comparison
    ? comparison.file1.pageCount === comparison.file2.pageCount
    : false;

  return (
    <ToolPage
      toolId="compare"
      multiple={true}
      maxFiles={2}
    >
      <div className="space-y-4">
        {/* Info card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Upload exactly <strong>2 PDF files</strong> to compare their metadata, page counts, file sizes, and page dimensions side by side.
                </p>
                <p>
                  Differences are highlighted so you can quickly spot what changed between two versions of a document.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning for wrong file count */}
        {files.length > 0 && files.length !== 2 && (
          <Card className="border-amber-200 dark:border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    {files.length === 1
                      ? 'Please upload a second PDF file to compare.'
                      : 'Please upload exactly 2 PDF files to compare. Remove extra files.'}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Currently uploaded: <strong>{files.length}</strong> file{files.length !== 1 ? 's' : ''} · Need: <strong>2</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 dark:border-sky-800 dark:border-t-sky-400" />
                <p className="text-sm text-muted-foreground">Comparing PDF files...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-red-200 dark:border-red-800/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-700 dark:text-red-300">Comparison failed</p>
                  <p className="text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison results */}
        {comparison && !loading && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Summary card */}
            <Card className={differenceCount === 0
              ? 'border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20'
              : 'border-sky-200 dark:border-sky-800/50 bg-sky-50/50 dark:bg-sky-950/20'
            }>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {differenceCount === 0 ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400 shrink-0" />
                  ) : (
                    <GitCompare className="h-6 w-6 text-sky-500 dark:text-sky-400 shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold text-sm ${differenceCount === 0 ? 'text-green-700 dark:text-green-300' : 'text-sky-700 dark:text-sky-300'}`}>
                      {differenceCount === 0
                        ? 'No differences found — the two PDFs have identical properties'
                        : `${differenceCount} difference${differenceCount !== 1 ? 's' : ''} found between the two PDFs`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Compared: file size, page count, dimensions, and metadata
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Side-by-side comparison table */}
            <div className="rounded-2xl border bg-card overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_auto_1fr] border-b bg-muted/30">
                <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  File 1
                </div>
                <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  Status
                </div>
                <div className="p-3 w-10" />
                <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  File 2
                </div>
              </div>

              {/* Rows */}
              {comparisonRows.map((row) => {
                const RowIcon = row.icon;
                const match = valuesMatch(row.value1, row.value2);

                return (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1fr_1fr_auto_1fr] border-b last:border-b-0 transition-colors ${
                      match
                        ? 'hover:bg-muted/20'
                        : 'bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50/70 dark:hover:bg-red-950/20'
                    }`}
                  >
                    {/* File 1 value */}
                    <div className="p-3 flex items-start gap-2">
                      <RowIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{row.label}</p>
                        <p className="text-sm font-medium break-all">{row.value1}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="p-3 flex items-center justify-end">
                      {match ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="p-3 flex items-center justify-center w-10">
                      {!match && (
                        <ArrowRight className="h-4 w-4 text-red-400 dark:text-red-500" />
                      )}
                    </div>

                    {/* File 2 value */}
                    <div className="p-3 flex items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{row.label}</p>
                        <p className={`text-sm break-all ${!match ? 'font-semibold text-red-700 dark:text-red-300' : 'font-medium'}`}>
                          {row.value2}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Page-by-page dimensions comparison */}
            {pageDimsMatch && comparison.file1.pageCount > 1 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-sky-500" />
                    Page-by-Page Dimensions Comparison
                  </h3>
                  <div className="rounded-xl border overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_1fr] border-b bg-muted/30">
                      <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12 text-center">
                        Page
                      </div>
                      <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        File 1
                      </div>
                      <div className="p-2 w-10 text-center" />
                      <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        File 2
                      </div>
                    </div>
                    {comparison.file1.dimensions.map((dim1, index) => {
                      const dim2 = comparison.file2.dimensions[index];
                      const pageMatch = dim2 && dim1.width === dim2.width && dim1.height === dim2.height;

                      return (
                        <div
                          key={index}
                          className={`grid grid-cols-[auto_1fr_auto_1fr] border-b last:border-b-0 text-sm ${
                            pageMatch
                              ? 'hover:bg-muted/20'
                              : 'bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50/70 dark:hover:bg-red-950/20'
                          }`}
                        >
                          <div className="p-2 text-center text-muted-foreground font-medium w-12">
                            {index + 1}
                          </div>
                          <div className={`p-2 ${!pageMatch ? 'font-medium' : ''}`}>
                            {dim1.width.toFixed(1)} × {dim1.height.toFixed(1)} pt
                            <span className="text-muted-foreground text-xs ml-1">
                              ({formatPtToInches(dim1.width)} × {formatPtToInches(dim1.height)} in)
                            </span>
                          </div>
                          <div className="p-2 flex items-center justify-center w-10">
                            {pageMatch ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                <ArrowRight className="h-3 w-3 text-red-400 dark:text-red-500 ml-0.5" />
                              </>
                            )}
                          </div>
                          <div className={`p-2 ${!pageMatch ? 'font-semibold text-red-700 dark:text-red-300' : ''}`}>
                            {dim2
                              ? <>
                                  {dim2.width.toFixed(1)} × {dim2.height.toFixed(1)} pt
                                  <span className="text-muted-foreground text-xs ml-1">
                                    ({formatPtToInches(dim2.width)} × {formatPtToInches(dim2.height)} in)
                                  </span>
                                </>
                              : '—'
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page count mismatch notice */}
            {!pageDimsMatch && comparison && (
              <Card className="border-amber-200 dark:border-amber-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-300">
                        Page count mismatch — page-by-page comparison unavailable
                      </p>
                      <p className="text-muted-foreground mt-1">
                        File 1 has <strong>{comparison.file1.pageCount}</strong> pages, while File 2 has <strong>{comparison.file2.pageCount}</strong> pages. Page-by-page dimensions comparison requires the same number of pages.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
