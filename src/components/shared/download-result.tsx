'use client';

import React from 'react';
import { Download, FileDown, RotateCcw, CheckCircle2, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/file-store';
import { formatFileSize } from '@/lib/pdf-utils';
import { saveAs } from 'file-saver';

export function DownloadResult() {
  const { result, processingState, files, resetAll } = useFileStore();

  if (processingState !== 'success' || !result) return null;

  const handleDownload = () => {
    saveAs(result.blob, result.filename);
  };

  const originalSize = files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) : 0;
  const savedBytes = originalSize - result.size;
  const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
  const isSmaller = savedBytes > 0;

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 p-6 space-y-5 animate-in fade-in duration-500">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-lg">Processing Complete</p>
          <p className="text-sm text-muted-foreground">Your file is ready to download</p>
        </div>
      </div>

      {/* File info card */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-background/80 border">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{result.filename}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-muted-foreground">
              {formatFileSize(result.size)}
            </p>
            {isSmaller && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <TrendingDown className="h-3 w-3" />
                {savedPercent}% smaller
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md shadow-green-600/20"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
        <Button onClick={resetAll} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  );
}
