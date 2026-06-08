'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { deletePDFPages } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, FileText } from 'lucide-react';

export function DeletePagesTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const totalPages = useMemo(() => {
    if (files.length > 0 && files[0].pageCount) {
      return files[0].pageCount;
    }
    return 0;
  }, [files]);

  // Reset selection when files change
  const currentFileId = files.length > 0 ? files[0].id : '';
  if (currentFileId && !initialized) {
    setSelectedPages(new Set());
    setInitialized(true);
  }
  if (!currentFileId && initialized) {
    setInitialized(false);
  }

  const togglePage = useCallback((pageIndex: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      return next;
    });
  }, []);

  const selectOdd = useCallback(() => {
    if (totalPages === 0) return;
    setSelectedPages((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < totalPages; i++) {
        // Page numbers are 1-based, so odd page numbers = even indices
        if ((i + 1) % 2 === 1) {
          next.add(i);
        }
      }
      return next;
    });
  }, [totalPages]);

  const selectEven = useCallback(() => {
    if (totalPages === 0) return;
    setSelectedPages((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < totalPages; i++) {
        // Even page numbers = odd indices
        if ((i + 1) % 2 === 0) {
          next.add(i);
        }
      }
      return next;
    });
  }, [totalPages]);

  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const handleDelete = async () => {
    if (files.length === 0 || selectedPages.size === 0) return;
    try {
      setProcessing('Deleting pages...');
      setProgress(30, 'Reading document...');

      const result = await deletePDFPages(
        files[0].data,
        Array.from(selectedPages)
      );

      setProgress(80, 'Creating new file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `deleted-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pages');
    }
  };

  const remainingPages = totalPages - selectedPages.size;
  const allPagesSelected = selectedPages.size === totalPages;

  return (
    <ToolPage
      toolId="delete-pages"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleDelete}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || selectedPages.size === 0 || allPagesSelected}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete {selectedPages.size} Page{selectedPages.size !== 1 ? 's' : ''}
        </Button>
      }
    >
      {files.length > 0 && totalPages > 0 && (
        <div className="space-y-4">
          {/* Selection controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectOdd}
              disabled={totalPages < 2}
            >
              Select Odd Pages
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectEven}
              disabled={totalPages < 2}
            >
              Select Even Pages
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={selectedPages.size === 0}
            >
              Clear Selection
            </Button>
          </div>

          {/* Selection info */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPages.size > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Trash2 className="h-3 w-3" />
                {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected for deletion
              </Badge>
            )}
            <Badge variant="secondary">
              {remainingPages} page{remainingPages !== 1 ? 's' : ''} remaining
            </Badge>
          </div>

          {/* Warning if all pages selected */}
          {allPagesSelected && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                You cannot delete all pages. At least one page must remain.
              </CardContent>
            </Card>
          )}

          {/* Page grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-1">
            {Array.from({ length: totalPages }, (_, i) => {
              const isSelected = selectedPages.has(i);
              return (
                <button
                  key={i}
                  onClick={() => togglePage(i)}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all duration-150 aspect-square ${
                    isSelected
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-400 shadow-sm'
                      : 'border-muted bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:border-red-800 dark:hover:bg-red-950/20'
                  }`}
                  aria-label={`Page ${i + 1}${isSelected ? ' (selected for deletion)' : ''}`}
                >
                  <FileText
                    className={`h-5 w-5 ${
                      isSelected
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isSelected
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Click on pages to select them for deletion. Selected pages will be highlighted in red.
          </p>
        </div>
      )}
    </ToolPage>
  );
}
