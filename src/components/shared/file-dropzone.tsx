'use client';

import React, { useCallback, useState, useRef } from 'react';
import { FileUp, FileText, Image as ImageIcon } from 'lucide-react';
import { generateId } from '@/lib/pdf-utils';
import { PDFFile } from '@/store/file-store';
import { useFileStore } from '@/store/file-store';
import { getPDFPageCount } from '@/lib/pdf-utils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles } = useFileStore();
  const isPDF = accept.includes('pdf');

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const pdfFiles: PDFFile[] = [];

    for (const file of files) {
      if (file.size > maxSize) {
        console.warn(`File ${file.name} exceeds maximum size`);
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
    }
  }, [addFiles, maxSize, onFilesAdded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl cursor-pointer
        transition-all duration-300 ease-in-out group
        ${isDragging
          ? 'border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent scale-[1.01] shadow-lg shadow-primary/10'
          : 'border-2 border-dashed border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/30'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload files"
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
        className="hidden"
      />

      {/* Background decoration when dragging */}
      {isDragging && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-primary/10 blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-primary/8 blur-2xl animate-pulse" />
        </div>
      )}

      <div className="flex flex-col items-center gap-4 p-8 sm:p-10">
        <div className={`
          p-4 rounded-2xl transition-all duration-300
          ${isDragging
            ? 'bg-primary/15 text-primary scale-110'
            : 'bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'
          }
        `}>
          {isDragging ? (
            <FileUp className="h-8 w-8" />
          ) : isPDF ? (
            <FileText className="h-8 w-8" />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">
            {isDragging ? 'Release to upload' : label}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
            {isPDF ? 'PDF' : 'JPG / PNG'}
          </span>
          <span>Max {maxSize / (1024 * 1024)}MB per file</span>
          {multiple && <span>Up to {maxFiles} files</span>}
        </div>
      </div>
    </div>
  );
}
