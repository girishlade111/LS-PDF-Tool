'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileImage, Zap, Eye, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { getPdfjs } from '@/lib/pdf-worker';

type QualityLevel = 'standard' | 'high' | 'ultra';

const qualityOptions: {
  id: QualityLevel;
  label: string;
  scale: number;
  description: string;
  estimatedSize: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'standard',
    label: 'Standard',
    scale: 1,
    description: 'Good quality, smaller file size',
    estimatedSize: '~200-500 KB per page',
    icon: Zap,
  },
  {
    id: 'high',
    label: 'High',
    scale: 2,
    description: 'Great quality, balanced file size',
    estimatedSize: '~500 KB - 2 MB per page',
    icon: Eye,
  },
  {
    id: 'ultra',
    label: 'Ultra',
    scale: 3,
    description: 'Maximum quality, larger file size',
    estimatedSize: '~1-5 MB per page',
    icon: Sparkles,
  },
];

const MAX_CANVAS_DIM = 8192;

function canvasToBlobWithTimeout(
  canvas: HTMLCanvasElement,
  type: string,
  timeoutMs = 60_000,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Canvas rendering timed out')),
      timeoutMs,
    );
    canvas.toBlob((b) => {
      clearTimeout(timer);
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob returned null — likely out of memory'));
    }, type);
  });
}

function checkCanvasDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid canvas dimensions: ${width}x${height}`);
  }
  if (width > MAX_CANVAS_DIM || height > MAX_CANVAS_DIM) {
    throw new Error(
      `Page too large for rendering at this quality level (${Math.round(width)}x${Math.round(height)} exceeds ${MAX_CANVAS_DIM}px limit). Try a lower quality setting.`,
    );
  }
}

export function PDFToPNGTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [quality, setQuality] = useState<QualityLevel>('high');

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Converting PDF to PNG images...');

      const selectedQuality = qualityOptions.find((q) => q.id === quality)!;

      const pdfjsLib = await getPdfjs();

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const numPages = pdf.numPages;
      const scale = selectedQuality.scale;

      if (numPages === 1) {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale });
        checkCanvasDimensions(viewport.width, viewport.height);
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvas, viewport }).promise;

        const blob = await canvasToBlobWithTimeout(canvas, 'image/png');
        canvas.width = 0;
        canvas.height = 0;

        setProgress(100, 'Done!');
        setSuccess({
          blob,
          filename: 'page-1.png',
          size: blob.size,
        });
      } else {
        const zip = new JSZip();

        for (let i = 1; i <= numPages; i++) {
          setProgress(
            Math.round((i / numPages) * 85),
            `Converting page ${i} of ${numPages}...`,
          );

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          checkCanvasDimensions(viewport.width, viewport.height);
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvas, viewport }).promise;

          const blob = await canvasToBlobWithTimeout(canvas, 'image/png');
          canvas.width = 0;
          canvas.height = 0;

          zip.file(`page-${i}.png`, blob);
        }

        setProgress(90, 'Packaging images...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setProgress(100, 'Done!');
        setSuccess({
          blob: zipBlob,
          filename: 'pdf-images.zip',
          size: zipBlob.size,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to convert PDF to PNG'
      );
    }
  };

  return (
    <ToolPage
      toolId="pdf-to-png"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleConvert}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0}
        >
          <FileImage className="h-4 w-4 mr-2" />
          Convert to PNG
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Quality selection */}
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <p className="text-sm font-medium">Quality / Scale</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {qualityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = quality === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setQuality(option.id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-lime-500 bg-lime-50 dark:bg-lime-950/30 dark:border-lime-400 shadow-sm'
                      : 'border-muted bg-background hover:border-lime-300 dark:hover:border-lime-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected
                          ? 'text-lime-600 dark:text-lime-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {option.label}
                      <span className="text-muted-foreground font-normal">
                        {' '}
                        ({option.scale}x)
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~{option.estimatedSize}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Each page of your PDF will be converted to a high-quality PNG image.
              {files.length > 0 && files[0].pageCount === 1
                ? ' Your single-page PDF will be downloaded directly as a PNG.'
                : ' Multiple pages will be packaged in a ZIP file.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  );
}
