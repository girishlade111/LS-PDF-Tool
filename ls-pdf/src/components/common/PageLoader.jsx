import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-muted font-medium">Loading tool...</p>
    </div>
  );
}
