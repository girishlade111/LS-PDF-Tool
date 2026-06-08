'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { rotatePDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { RotateCw, RotateCcw } from 'lucide-react';

export function RotatePDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [rotation, setRotation] = useState(90);

  const handleRotate = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Rotating PDF...');
      setProgress(30, 'Reading document...');
      const result = await rotatePDF(files[0].data, rotation);
      setProgress(80, 'Applying rotation...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `rotated-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate PDF');
    }
  };

  return (
    <ToolPage
      toolId="rotate"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleRotate} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <RotateCw className="h-4 w-4 mr-2" />
          Rotate {rotation}°
        </Button>
      }
    >
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Select Rotation Angle</p>
        <div className="flex gap-2">
          {[90, 180, 270].map((angle) => (
            <Button
              key={angle}
              variant={rotation === angle ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRotation(angle)}
              className="flex-1"
            >
              {angle}°
            </Button>
          ))}
        </div>
      </div>
    </ToolPage>
  );
}
