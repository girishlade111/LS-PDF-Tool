'use client';

import React from 'react';
import { Download, FileDown, RotateCcw, CheckCircle2, TrendingDown, FileCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/file-store';
import { formatFileSize } from '@/lib/pdf-utils';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export function DownloadResult() {
  const { result, processingState, files, resetAll } = useFileStore();

  if (processingState !== 'success' || !result) return null;

  const handleDownload = () => {
    saveAs(result.blob, result.filename);
    toast.success('Download started', {
      description: `${result.filename} (${formatFileSize(result.size)})`,
      icon: <FileCheck className="h-4 w-4" />,
    });
  };

  const originalSize = files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) : 0;
  const savedBytes = originalSize - result.size;
  const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
  const isSmaller = savedBytes > 0;

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 p-6 space-y-5 animate-burst relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-green-400/10 dark:bg-green-500/5 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-green-300/5 dark:bg-green-600/5 blur-3xl" />

      {/* Success header */}
      <div className="flex items-center gap-3 relative">
        <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30 animate-scale-bounce">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-lg">Processing Complete</p>
          <p className="text-sm text-muted-foreground">Your file is ready to download</p>
        </div>
      </div>

      {/* File info card */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-background/80 border relative">
        <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
          <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{result.filename}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-muted-foreground">
              {formatFileSize(result.size)}
            </p>
            {isSmaller && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                <TrendingDown className="h-3 w-3" />
                {savedPercent}% smaller
              </div>
            )}
          </div>
        </div>
        {/* File type indicator */}
        <div className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          <Sparkles className="h-3 w-3 text-green-500" />
          PDF
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 relative">
        <Button
          onClick={handleDownload}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/30 transition-all duration-200 group"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
          Download File
          <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
        </Button>
        <Button onClick={resetAll} variant="outline" size="lg" className="hover:bg-muted/80 transition-colors duration-200">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  );
}
