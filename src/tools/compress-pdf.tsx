'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { compressPDF, formatFileSize } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minimize2, Zap, Scale, Shield } from 'lucide-react';

type CompressionQuality = 'low' | 'medium' | 'high';

const qualityOptions: {
  value: CompressionQuality;
  label: string;
  description: string;
  icon: React.ElementType;
  hint: string;
}[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Smaller file size, lower quality',
    icon: Zap,
    hint: '~40-60% smaller',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced size and quality',
    icon: Scale,
    hint: '~20-40% smaller',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Best quality, less compression',
    icon: Shield,
    hint: '~5-15% smaller',
  },
];

export function CompressPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [quality, setQuality] = useState<CompressionQuality>('medium');

  const handleCompress = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Compressing PDF...');
      setProgress(30, 'Analyzing document...');
      const result = await compressPDF(files[0].data, quality);
      setProgress(80, 'Optimizing...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `compressed-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress PDF');
    }
  };

  const selectedOption = qualityOptions.find((o) => o.value === quality);

  return (
    <ToolPage
      toolId="compress"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleCompress} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <Minimize2 className="h-4 w-4 mr-2" />
          Compress PDF
        </Button>
      }
    >
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Compression Quality</Label>
          <div className="grid grid-cols-3 gap-2">
            {qualityOptions.map((option) => (
              <Button
                key={option.value}
                variant={quality === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuality(option.value)}
                className="flex flex-col items-center gap-1 h-auto py-3 px-2"
              >
                <option.icon className="h-4 w-4" />
                <span className="font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        {selectedOption && (
          <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">{selectedOption.description}</p>
            <p className="text-xs font-medium text-primary">
              Expected savings: {selectedOption.hint}
            </p>
          </div>
        )}
        {files.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Original size</span>
            <span className="text-sm font-medium">{formatFileSize(files[0].size)}</span>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
