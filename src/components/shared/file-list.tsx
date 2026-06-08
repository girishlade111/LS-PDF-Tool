'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, FileText, GripVertical, ImageIcon, Plus, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore, PDFFile } from '@/store/file-store';
import { formatFileSize, generateId, getPDFPageCount } from '@/lib/pdf-utils';

function getFileTypeIcon(type: string) {
  if (type === 'application/pdf') return FileText;
  if (type.startsWith('image/')) return ImageIcon;
  return File;
}

function getFileTypeColor(type: string) {
  if (type === 'application/pdf') return 'text-red-500 dark:text-red-400';
  if (type.startsWith('image/jpeg') || type.startsWith('image/jpg')) return 'text-blue-500 dark:text-blue-400';
  if (type.startsWith('image/png')) return 'text-emerald-500 dark:text-emerald-400';
  if (type.startsWith('image/')) return 'text-purple-500 dark:text-purple-400';
  return 'text-muted-foreground';
}

function getFileTypeBg(type: string) {
  if (type === 'application/pdf') return 'bg-red-50 dark:bg-red-950/30';
  if (type.startsWith('image/jpeg') || type.startsWith('image/jpg')) return 'bg-blue-50 dark:bg-blue-950/30';
  if (type.startsWith('image/png')) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (type.startsWith('image/')) return 'bg-purple-50 dark:bg-purple-950/30';
  return 'bg-muted/50';
}

export function FileList() {
  const { files, removeFile, reorderFiles, addFiles } = useFileStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(new Set());
  const prevFileIds = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect newly added files for entrance animation
    const currentIds = new Set(files.map((f) => f.id));
    const newIds = new Set<string>();
    currentIds.forEach((id) => {
      if (!prevFileIds.current.has(id)) {
        newIds.add(id);
      }
    });
    if (newIds.size > 0) {
      setAnimatedIds(newIds);
      const timer = setTimeout(() => setAnimatedIds(new Set()), 500);
      return () => clearTimeout(timer);
    }
    prevFileIds.current = currentIds;
  }, [files]);

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
  }, [files, thumbnails]);

  const processAdditionalFiles = useCallback(async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList);
    const pdfFiles: PDFFile[] = [];

    for (const file of fileArray) {
      const arrayBuffer = await file.arrayBuffer();
      let pageCount: number | undefined;

      try {
        if (file.type === 'application/pdf') {
          pageCount = await getPDFPageCount(arrayBuffer);
        }
      } catch {
        // Not a valid PDF, still add it
      }

      pdfFiles.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        data: arrayBuffer,
        pageCount,
      });
    }

    if (pdfFiles.length > 0) {
      addFiles(pdfFiles);
    }
  }, [addFiles]);

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

  const handleAddMoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAdditionalFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {files.map((file, index) => {
        const TypeIcon = getFileTypeIcon(file.type);
        const isNew = animatedIds.has(file.id);

        return (
          <div
            key={file.id}
            className={`flex items-center gap-3 rounded-lg border bg-card p-3 group transition-all duration-200 hover:border-primary/30 hover:shadow-sm ${isNew ? 'animate-file-in' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Drag handle */}
            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0 hover:text-muted-foreground transition-colors" />

            {/* Thumbnail or file type icon */}
            {thumbnails[file.id] ? (
              <div className="h-10 w-8 rounded border overflow-hidden shrink-0 shadow-sm">
                <img
                  src={thumbnails[file.id]}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${getFileTypeBg(file.type)}`}>
                <TypeIcon className={`h-5 w-5 ${getFileTypeColor(file.type)}`} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(file.size)}
                {file.pageCount !== undefined && ` · ${file.pageCount} page${file.pageCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => removeFile(file.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      {/* Add more files button */}
      <button
        onClick={handleAddMoreClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        Add more files
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
