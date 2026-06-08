'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { organizePDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { LayoutList, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export function OrganizePDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Derive initial page order from file pageCount
  const initialPageOrder = useMemo(() => {
    if (files.length > 0 && files[0].pageCount) {
      return Array.from({ length: files[0].pageCount }, (_, i) => i);
    }
    return [];
  }, [files]);

  // Reset when files change, using a ref to track previous file
  const currentFileId = files.length > 0 ? files[0].id : '';
  if (currentFileId && !initialized) {
    setPageOrder(initialPageOrder);
    setDeletedPages(new Set());
    setInitialized(true);
  }
  if (!currentFileId && initialized) {
    setInitialized(false);
  }

  const toggleDelete = useCallback((pageIndex: number) => {
    setDeletedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      return next;
    });
  }, []);

  const movePage = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= pageOrder.length) return;
    const newOrder = [...pageOrder];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setPageOrder(newOrder);
  }, [pageOrder]);

  const handleOrganize = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Organizing PDF...');
      setProgress(30, 'Reading document...');
      const result = await organizePDF(files[0].data, pageOrder, Array.from(deletedPages));
      setProgress(80, 'Creating organized file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `organized-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to organize PDF');
    }
  };

  const activePages = pageOrder.filter((i) => !deletedPages.has(i));

  return (
    <ToolPage
      toolId="organize"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleOrganize} size="lg" className="w-full sm:w-auto" disabled={files.length === 0 || activePages.length === 0}>
          <LayoutList className="h-4 w-4 mr-2" />
          Save Organized PDF ({activePages.length} page{activePages.length !== 1 ? 's' : ''})
        </Button>
      }
    >
      {files.length > 0 && pageOrder.length > 0 && (
        <div className="space-y-2 rounded-xl border bg-card p-4 max-h-96 overflow-y-auto">
          <p className="text-sm font-medium mb-3">Page Order</p>
          {pageOrder.map((pageIndex, displayIndex) => (
            <div
              key={pageIndex}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                deletedPages.has(pageIndex) ? 'opacity-40 bg-destructive/5 border-destructive/20' : 'bg-background'
              }`}
            >
              <span className="text-sm font-mono w-8 text-center">#{pageIndex + 1}</span>
              <div className="flex-1 text-sm">
                Page {pageIndex + 1}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => movePage(displayIndex, 'up')}
                  disabled={displayIndex === 0}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => movePage(displayIndex, 'down')}
                  disabled={displayIndex === pageOrder.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${deletedPages.has(pageIndex) ? 'text-green-600' : 'text-destructive'}`}
                  onClick={() => toggleDelete(pageIndex)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolPage>
  );
}
