'use client';

import React from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { FileImage } from 'lucide-react';
import JSZip from 'jszip';
import { getPdfjs } from '@/lib/pdf-worker';

const BLOB_TIMEOUT = 60_000;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Canvas rendering timed out')),
      BLOB_TIMEOUT,
    );
    canvas.toBlob((b) => {
      clearTimeout(timer);
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob returned null — likely out of memory'));
    }, type, quality);
  });
}

function freeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

export function PDFToJPGTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Converting PDF to images...');

      const pdfjsLib = await getPdfjs();

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const numPages = pdf.numPages;

      const SCALE = 2.0;

      if (numPages === 1) {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D rendering context');

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        freeCanvas(canvas);

        setProgress(100, 'Done!');
        setSuccess({ blob, filename: 'page-1.jpg', size: blob.size });
      } else {
        const zip = new JSZip();

        for (let i = 1; i <= numPages; i++) {
          setProgress(
            Math.round((i / numPages) * 85),
            `Converting page ${i} of ${numPages}...`,
          );

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: SCALE });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get 2D rendering context');

          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
          freeCanvas(canvas);

          zip.file(`page-${i}.jpg`, blob);
        }

        setProgress(90, 'Packaging images...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setProgress(100, 'Done!');
        setSuccess({ blob: zipBlob, filename: 'pdf-images.zip', size: zipBlob.size });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert PDF to images');
    }
  };

  return (
    <ToolPage
      toolId="pdf-to-jpg"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleConvert} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <FileImage className="h-4 w-4 mr-2" />
          Convert to JPG
        </Button>
      }
    >
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Convert each page of your PDF into a high-quality JPG image. Multiple pages will be packaged in a ZIP file.
        </p>
      </div>
    </ToolPage>
  );
}
