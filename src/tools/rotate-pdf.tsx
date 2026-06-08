'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { rotatePDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCw, RotateCcw, FileText } from 'lucide-react';

type RotationDirection = 'clockwise' | 'counterclockwise';

export function RotatePDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [rotation, setRotation] = useState(90);
  const [direction, setDirection] = useState<RotationDirection>('clockwise');

  const effectiveRotation = direction === 'clockwise' ? rotation : -rotation;

  const handleRotate = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Rotating PDF...');
      setProgress(30, 'Reading document...');
      const result = await rotatePDF(files[0].data, effectiveRotation);
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
          {direction === 'clockwise' ? (
            <RotateCw className="h-4 w-4 mr-2" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Rotate {Math.abs(effectiveRotation)}° {direction === 'clockwise' ? 'CW' : 'CCW'}
        </Button>
      }
    >
      <div className="space-y-5 rounded-xl border bg-card p-4">
        {/* Visual rotation preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="flex items-center justify-center h-36 rounded-lg border bg-muted/20">
            <div
              className="w-16 h-20 rounded border-2 border-primary/60 bg-primary/5 flex items-center justify-center transition-transform duration-300"
              style={{ transform: `rotate(${effectiveRotation}deg)` }}
            >
              <FileText className="h-6 w-6 text-primary/60" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Result: {effectiveRotation > 0 ? '+' : ''}{effectiveRotation}° rotation
          </p>
        </div>

        {/* Direction toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Direction</Label>
          <div className="flex gap-2">
            <Button
              variant={direction === 'clockwise' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDirection('clockwise')}
              className="flex-1"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1.5" />
              Clockwise
            </Button>
            <Button
              variant={direction === 'counterclockwise' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDirection('counterclockwise')}
              className="flex-1"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Counter-clockwise
            </Button>
          </div>
        </div>

        {/* Angle selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Rotation Angle</Label>
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
      </div>
    </ToolPage>
  );
}
