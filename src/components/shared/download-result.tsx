'use client';

import React from 'react';
import { Download, FileDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/file-store';
import { formatFileSize } from '@/lib/pdf-utils';
import { saveAs } from 'file-saver';

export function DownloadResult() {
  const { result, processingState, resetAll } = useFileStore();

  if (processingState !== 'success' || !result) return null;

  const handleDownload = () => {
    saveAs(result.blob, result.filename);
  };

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-50">
          <FileDown className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="font-medium">{result.filename}</p>
          <p className="text-sm text-muted-foreground">
            Size: {formatFileSize(result.size)}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={resetAll} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
