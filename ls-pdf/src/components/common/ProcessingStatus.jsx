import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProcessingStatus({ progress = 0, message = 'Processing...' }) {
  // Ensure progress stays between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-surface border border-muted/20 rounded-xl shadow-sm">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      
      <div className="w-full max-w-md bg-muted/20 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      
      <div className="flex justify-between w-full max-w-md text-sm mt-1">
        <span className="text-text font-medium">{message}</span>
        <span className="text-muted font-medium">{Math.round(clampedProgress)}%</span>
      </div>
    </div>
  );
}
