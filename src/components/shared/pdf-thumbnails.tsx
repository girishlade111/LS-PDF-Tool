'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { PDFFile } from '@/store/file-store';

interface PDFThumbnailsProps {
  file: PDFFile;
  maxThumbnails?: number;
  selectedPages?: Set<number>;
  onSelectPage?: (pageIndex: number) => void;
}

export function PDFThumbnails({
  file,
  maxThumbnails = 10,
  selectedPages,
  onSelectPage,
}: PDFThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnails() {
      try {
        const pdfjsLib = await getPdfjs();

        const pdf = await pdfjsLib.getDocument({ data: file.data }).promise;
        const numPages = pdf.numPages;
        setTotalPages(numPages);

        const thumbs: string[] = [];
        const pagesToRender = Math.min(numPages, maxThumbnails);

        for (let i = 1; i <= pagesToRender; i++) {
          if (cancelled) break;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;

          await page.render({ canvasContext: ctx, viewport }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          thumbs.push(dataUrl);
        }

        if (!cancelled) {
          setThumbnails(thumbs);
        }
      } catch (err) {
        console.error('Failed to render thumbnails:', err);
      }
    }

    renderThumbnails();

    return () => {
      cancelled = true;
    };
  }, [file.data, maxThumbnails]);

  if (thumbnails.length === 0 && totalPages === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground">
        <FileText className="h-6 w-6 mr-2" />
        <span className="text-sm">Loading preview...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Page Preview</p>
        <p className="text-xs text-muted-foreground">
          {totalPages} page{totalPages !== 1 ? 's' : ''}
          {totalPages > maxThumbnails && ` (showing first ${maxThumbnails})`}
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {thumbnails.map((thumb, index) => {
          const isSelected = selectedPages?.has(index);
          return (
            <button
              key={index}
              onClick={() => onSelectPage?.(index)}
              className={`shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/30'
              }`}
            >
              <div className="relative">
                <img
                  src={thumb}
                  alt={`Page ${index + 1}`}
                  className="w-20 h-28 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                  {index + 1}
                </div>
              </div>
            </button>
          );
        })}
        {totalPages > maxThumbnails && (
          <div className="shrink-0 flex items-center justify-center w-20 h-28 rounded-lg border border-dashed border-muted-foreground/30">
            <span className="text-xs text-muted-foreground">
              +{totalPages - maxThumbnails}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
