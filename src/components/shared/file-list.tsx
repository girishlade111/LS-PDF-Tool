'use client';

import React, { useEffect, useState } from 'react';
import { X, FileText, GripVertical, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/file-store';
import { formatFileSize } from '@/lib/pdf-utils';

export function FileList() {
  const { files, removeFile, reorderFiles } = useFileStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnails() {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const newThumbnails: Record<string, string> = {};

      for (const file of files) {
        if (cancelled) break;
        if (thumbnails[file.id]) {
          newThumbnails[file.id] = thumbnails[file.id];
          continue;
        }

        try {
          if (file.type === 'application/pdf') {
            const pdf = await pdfjsLib.getDocument({ data: file.data }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;
            await page.render({ canvasContext: ctx, viewport }).promise;
            newThumbnails[file.id] = canvas.toDataURL('image/jpeg', 0.6);
          }
        } catch {
          // Skip thumbnails for non-PDF files or errors
        }
      }

      if (!cancelled) {
        setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
      }
    }

    if (files.length > 0) {
      renderThumbnails();
    }

    return () => {
      cancelled = true;
    };
  }, [files]);

  if (files.length === 0) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex) {
      reorderFiles(fromIndex, toIndex);
    }
  };

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 group"
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

          {/* Thumbnail */}
          {thumbnails[file.id] ? (
            <img
              src={thumbnails[file.id]}
              alt={file.name}
              className="h-10 w-8 object-cover rounded border shrink-0"
            />
          ) : file.type === 'application/pdf' ? (
            <FileText className="h-5 w-5 text-red-500 shrink-0" />
          ) : (
            <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
              {file.pageCount !== undefined && ` · ${file.pageCount} page${file.pageCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => removeFile(file.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
