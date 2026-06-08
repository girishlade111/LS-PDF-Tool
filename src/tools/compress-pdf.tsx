'use client';

import React from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { compressPDF, formatFileSize } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';

export function CompressPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();

  const handleCompress = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Compressing PDF...');
      setProgress(30, 'Analyzing document...');
      const result = await compressPDF(files[0].data);
      setProgress(80, 'Optimizing...');
      const blob = new Blob([result], { type: 'application/pdf' });
      const savings = ((1 - blob.size / files[0].size) * 100).toFixed(1);
      setSuccess({
        blob,
        filename: `compressed-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress PDF');
    }
  };

  return (
    <ToolPage
      toolId="compress"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleCompress} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <Minimize2 className="h-4 w-4 mr-2" />
          Compress PDF
        </Button>
      }
    >
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Upload a PDF to reduce its file size. The tool will strip metadata and optimize the document structure.
        </p>
      </div>
    </ToolPage>
  );
}
