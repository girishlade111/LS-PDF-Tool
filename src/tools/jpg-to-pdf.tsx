'use client';

import React from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { imagesToPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';

export function JPGToPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Converting images to PDF...');
      setProgress(30, 'Processing images...');
      const result = await imagesToPDF(files.map((f) => f.data));
      setProgress(80, 'Creating PDF...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: 'images.pdf',
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert images to PDF');
    }
  };

  return (
    <ToolPage
      toolId="jpg-to-pdf"
      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
      multiple={true}
      maxFiles={50}
      actionButton={
        <Button onClick={handleConvert} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <ImagePlus className="h-4 w-4 mr-2" />
          Create PDF from {files.length} Image{files.length !== 1 ? 's' : ''}
        </Button>
      }
    >
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Select JPG or PNG images to combine into a single PDF document. Each image will become one page.
        </p>
      </div>
    </ToolPage>
  );
}
