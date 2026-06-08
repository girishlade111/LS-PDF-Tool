'use client';

import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useFileStore } from '@/store/file-store';

export function ProcessingStatus() {
  const { processingState, processingProgress, processingMessage } = useFileStore();

  if (processingState === 'idle') return null;

  return (
    <div className={`
      rounded-2xl border p-6 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300
      ${processingState === 'processing' ? 'bg-muted/30 border-muted' : ''}
      ${processingState === 'success' ? 'bg-green-50/50 border-green-200/50 dark:bg-green-950/10 dark:border-green-800/30' : ''}
      ${processingState === 'error' ? 'bg-destructive/5 border-destructive/20' : ''}
    `}>
      <div className="flex items-center gap-3">
        {processingState === 'processing' && (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        {processingState === 'success' && (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
        {processingState === 'error' && (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        <span className="font-medium">{processingMessage}</span>
      </div>
      {processingState === 'processing' && (
        <Progress
          value={processingProgress}
          className="h-2 progress-processing"
        />
      )}
    </div>
  );
}
