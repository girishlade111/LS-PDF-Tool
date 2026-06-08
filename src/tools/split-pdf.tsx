'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { splitPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, Info } from 'lucide-react';
import JSZip from 'jszip';

export function SplitPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [splitMode, setSplitMode] = useState<'each' | 'ranges' | 'chunks'>('each');
  const [rangeInput, setRangeInput] = useState('1-3, 4-6, 7-10');
  const [chunkSize, setChunkSize] = useState(1);

  const handleSplit = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Splitting PDF...');
      const file = files[0];
      const pageCount = file.pageCount || 1;

      let pageRanges: number[][];

      if (splitMode === 'each') {
        pageRanges = Array.from({ length: pageCount }, (_, i) => [i]);
      } else if (splitMode === 'ranges') {
        pageRanges = rangeInput.split(',').map((range) => {
          const parts = range.trim().split('-').map((n) => parseInt(n.trim()) - 1);
          if (parts.length === 1) return [parts[0]];
          const start = Math.max(0, parts[0]);
          const end = Math.min(pageCount - 1, parts[1]);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        });
      } else {
        // chunks
        pageRanges = [];
        for (let i = 0; i < pageCount; i += chunkSize) {
          const chunk = Array.from(
            { length: Math.min(chunkSize, pageCount - i) },
            (_, j) => i + j
          );
          pageRanges.push(chunk);
        }
      }

      setProgress(30, 'Splitting pages...');
      const results = await splitPDF(file.data, pageRanges);

      if (results.length === 1) {
        const blob = new Blob([results[0]], { type: 'application/pdf' });
        setSuccess({ blob, filename: 'split.pdf', size: blob.size });
      } else {
        setProgress(70, 'Creating ZIP archive...');
        const zip = new JSZip();
        results.forEach((pdf, i) => {
          zip.file(`page-${i + 1}.pdf`, pdf);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setSuccess({ blob: zipBlob, filename: 'split-pages.zip', size: zipBlob.size });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF');
    }
  };

  return (
    <ToolPage
      toolId="split"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleSplit} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <Scissors className="h-4 w-4 mr-2" />
          Split PDF
        </Button>
      }
    >
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex gap-2">
          {(['each', 'ranges', 'chunks'] as const).map((mode) => (
            <Button
              key={mode}
              variant={splitMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSplitMode(mode)}
            >
              {mode === 'each' ? 'Each Page' : mode === 'ranges' ? 'Ranges' : 'Chunks'}
            </Button>
          ))}
        </div>
        {splitMode === 'ranges' && (
          <div className="space-y-2">
            <Label>Page Ranges (e.g., 1-3, 4-6, 7-10)</Label>
            <Input
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="1-3, 4-6, 7-10"
            />
          </div>
        )}
        {splitMode === 'chunks' && (
          <div className="space-y-2">
            <Label>Pages per chunk</Label>
            <Input
              type="number"
              min={1}
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value) || 1)}
            />
          </div>
        )}
        {splitMode === 'each' && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Each page will be extracted as a separate PDF file, packaged in a ZIP.</span>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
