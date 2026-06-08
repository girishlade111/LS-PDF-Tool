'use client';

import React from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { FileImage } from 'lucide-react';
import JSZip from 'jszip';

export function PDFToJPGTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Converting PDF to images...');

      // Dynamic import of pdfjs-dist to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const numPages = pdf.numPages;
      const images: Blob[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 80), `Converting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
        });
        images.push(blob);
      }

      setProgress(85, 'Packaging images...');

      if (images.length === 1) {
        setSuccess({ blob: images[0], filename: 'page-1.jpg', size: images[0].size });
      } else {
        const zip = new JSZip();
        images.forEach((img, i) => {
          zip.file(`page-${i + 1}.jpg`, img);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
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
