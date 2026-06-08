'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { generateId } from '@/lib/pdf-utils';
import { PDFFile } from '@/store/file-store';
import { useFileStore } from '@/store/file-store';
import { getPDFPageCount } from '@/lib/pdf-utils';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
  onFilesAdded?: (files: PDFFile[]) => void;
}

export function FileDropzone({
  accept = '.pdf',
  multiple = true,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  label = 'Drop files here',
  description = 'or click to browse',
  onFilesAdded,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles } = useFileStore();

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
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200 ease-in-out
        ${isDragging 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <div className={`
          p-4 rounded-full transition-colors
          ${isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
        `}>
          <Upload className="h-8 w-8" />
        </div>
        <div>
          <p className="text-lg font-medium">{label}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {accept.includes('pdf') ? 'PDF' : 'Image'} files up to {maxSize / (1024 * 1024)}MB
          {multiple && ` · Up to ${maxFiles} files`}
        </p>
      </div>
    </div>
  );
}
