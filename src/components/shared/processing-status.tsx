'use client';

import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useFileStore } from '@/store/file-store';

export function ProcessingStatus() {
  const { processingState, processingProgress, processingMessage } = useFileStore();

  if (processingState === 'idle') return null;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        {processingState === 'processing' && (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        {processingState === 'success' && (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        )}
        {processingState === 'error' && (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        <span className="font-medium">{processingMessage}</span>
      </div>
      <Progress 
        value={processingState === 'success' ? 100 : processingProgress} 
        className="h-2"
      />
    </div>
  );
}
