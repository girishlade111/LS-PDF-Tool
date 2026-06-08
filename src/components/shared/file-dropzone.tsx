'use client';

import React, { useCallback, useState, useRef } from 'react';
import { FileUp, FileText, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { generateId, formatFileSize } from '@/lib/pdf-utils';
import { PDFFile } from '@/store/file-store';
import { useFileStore } from '@/store/file-store';
import { getPDFPageCount } from '@/lib/pdf-utils';
import { toast } from 'sonner';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  label?: string;
  description?: string;
  onFilesAdded?: (files: PDFFile[]) => void;
}

export function FileDropzone({
  accept = '.pdf',
  multiple = true,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024,
  label = 'Drop files here',
  description = 'or click to browse',
  onFilesAdded,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles, files } = useFileStore();
  const isPDF = accept.includes('pdf');
  const isImage = accept.includes('jpg') || accept.includes('png') || accept.includes('image');
  const hasFiles = files.length > 0;

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList);
    const pdfFiles: PDFFile[] = [];
    let skippedCount = 0;

    for (const file of fileArray) {
      if (file.size > maxSize) {
        skippedCount++;
        toast.error(`File too large`, {
          description: `${file.name} (${formatFileSize(file.size)}) exceeds the ${formatFileSize(maxSize)} limit.`,
        });
        continue;
      }

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
      onFilesAdded?.(pdfFiles);
      const count = pdfFiles.length;
      toast.success(`${count} file${count !== 1 ? 's' : ''} added`, {
        description: pdfFiles.length === 1
          ? `${pdfFiles[0].name} (${formatFileSize(pdfFiles[0].size)})`
          : `${count} files ready for processing`,
      });
    }

    if (skippedCount > 0 && pdfFiles.length === 0) {
      toast.error('No files added', {
        description: 'All selected files exceeded the size limit.',
      });
    }
  }, [addFiles, maxSize, onFilesAdded]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCount((prev) => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCount((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCount(0);
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Build a helpful aria-label that describes the drop target.
  const ariaLabelText = `${label}. ${description}. ${
    multiple
      ? `Up to ${maxFiles} files, ${maxSize / (1024 * 1024)}MB each.`
      : `One file, up to ${maxSize / (1024 * 1024)}MB.`
  } Press Enter or Space to browse.`;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl cursor-pointer
        transition-all duration-300 ease-in-out group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${isDragging
          ? 'border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent scale-[1.01] shadow-lg shadow-primary/10'
          : 'border-2 border-dashed border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/30'
        }
      `}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabelText}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Animated rotating gradient border when idle and no files */}
      {!isDragging && !hasFiles && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden p-[2px]" aria-hidden="true">
          <div className="animate-rotate-border absolute inset-0 rounded-xl" style={{ '--gradient-angle': '0deg' } as React.CSSProperties} />
          <div className="absolute inset-[2px] rounded-[10px] bg-background" />
        </div>
      )}

      {/* Animated dashed border when idle and files already present */}
      {!isDragging && hasFiles && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 animate-border-dance opacity-30" style={{
            maskImage: 'linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }} />
        </div>
      )}

      {/* Green check overlay when files are present */}
      {hasFiles && !isDragging && (
        <div className="absolute top-3 right-3 z-10" aria-hidden="true">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 dark:bg-green-600 text-white shadow-md shadow-green-500/25 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Background decoration when dragging */}
      {isDragging && (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-primary/10 blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-primary/8 blur-2xl animate-pulse" />
        </div>
      )}

      {/* Drag count indicator */}
      {isDragging && dragCount > 0 && (
        <div className="absolute top-3 right-3 z-10" aria-hidden="true">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary text-primary-foreground animate-pulse">
            {dragCount} file{dragCount !== 1 ? 's' : ''} dragging
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 p-6 sm:p-10">
        <div
          className={`
            p-4 rounded-2xl transition-all duration-300
            ${isDragging
              ? 'bg-primary/15 text-primary scale-110'
              : 'bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'
            }
            ${!isDragging ? 'animate-float' : ''}
          `}
          style={!isDragging ? { animationDuration: '3s' } : undefined}
          aria-hidden="true"
        >
          {isDragging ? (
            <FileUp className="h-10 w-10" />
          ) : isPDF ? (
            <FileText className="h-10 w-10" />
          ) : (
            <ImageIcon className="h-10 w-10" />
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">
            {isDragging ? 'Release to upload' : label}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
          {/* Pulsing subtitle */}
          {!isDragging && (
            <p className="text-xs text-muted-foreground/60 mt-2 animate-gentle-pulse">
              Click or drag to upload
            </p>
          )}
        </div>

        {/* File type icons row */}
        <div className="flex items-center gap-2 mt-1">
          {isPDF && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">PDF</span>
            </div>
          )}
          {isImage && (
            <>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">JPG</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">PNG</span>
              </div>
            </>
          )}
          {!isPDF && !isImage && (
            <>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">PDF</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">JPG</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">PNG</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
          <span>Max {maxSize / (1024 * 1024)}MB per file</span>
          {multiple && <span>·</span>}
          {multiple && <span>Up to {maxFiles} files</span>}
        </div>
      </div>
    </div>
  );
}
