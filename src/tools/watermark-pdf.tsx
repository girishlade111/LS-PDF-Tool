'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { watermarkPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Droplets } from 'lucide-react';

export function WatermarkPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(30);

  const handleWatermark = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Adding watermark...');
      setProgress(30, 'Reading document...');
      const result = await watermarkPDF(files[0].data, watermarkText, {
        fontSize,
        opacity: opacity / 100,
      });
      setProgress(80, 'Applying watermark...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `watermarked-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add watermark');
    }
  };

  return (
    <ToolPage
      toolId="watermark"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleWatermark} size="lg" className="w-full sm:w-auto" disabled={files.length === 0 || !watermarkText.trim()}>
          <Droplets className="h-4 w-4 mr-2" />
          Add Watermark
        </Button>
      }
    >
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Label>Watermark Text</Label>
          <Input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter watermark text"
          />
        </div>
        <div className="space-y-2">
          <Label>Font Size: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={20}
            max={120}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Opacity: {opacity}%</Label>
          <Slider
            value={[opacity]}
            onValueChange={([v]) => setOpacity(v)}
            min={5}
            max={80}
            step={5}
          />
        </div>
      </div>
    </ToolPage>
  );
}
