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
      const images: Blob[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(
          Math.round((i / numPages) * 80),
          `Converting page ${i} of ${numPages}...`
        );
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: selectedQuality.scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        images.push(blob);
      }

      setProgress(85, 'Packaging images...');

      if (images.length === 1) {
        setSuccess({
          blob: images[0],
          filename: 'page-1.png',
          size: images[0].size,
        });
      } else {
        const zip = new JSZip();
        images.forEach((img, i) => {
          zip.file(`page-${i + 1}.png`, img);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
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
