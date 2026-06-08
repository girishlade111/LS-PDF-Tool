'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/store/file-store';

export function ErrorDisplay() {
  const { error, resetProcessing } = useFileStore();
  
  if (!error) return null;

  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm font-medium text-destructive">{error}</p>
      </div>
      <Button onClick={resetProcessing} variant="outline" size="sm">
        Try Again
      </Button>
    </div>
  );
}
