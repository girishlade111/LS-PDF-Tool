'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { getPDFPageDimensions, cropPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crop, Info, Ruler, FileText } from 'lucide-react';

type CropPreset = 'none' | 'remove-margins' | 'tight' | 'custom';

interface PageDimensions {
  width: number;
  height: number;
}

export function CropPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [preset, setPreset] = useState<CropPreset>('none');
  const [customMargins, setCustomMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [pageDimensions, setPageDimensions] = useState<PageDimensions[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [pageRange, setPageRange] = useState('');

  // Load page dimensions when a file is uploaded
  useEffect(() => {
    if (files.length === 0) return;
    let cancelled = false;
    getPDFPageDimensions(files[0].data).then((dims) => {
      if (!cancelled) setPageDimensions(dims);
    }).catch(() => {
      if (!cancelled) setPageDimensions([]);
    });
    return () => { cancelled = true; };
  }, [files]);

  // Clear dimensions when files are removed
  const effectiveDimensions = files.length === 0 ? [] : pageDimensions;

  const currentMargins = useMemo(() => {
    switch (preset) {
      case 'none':
        return { top: 0, bottom: 0, left: 0, right: 0 };
      case 'remove-margins':
        return { top: 36, bottom: 36, left: 36, right: 36 };
      case 'tight':
        return { top: 54, bottom: 54, left: 54, right: 54 };
      case 'custom':
        return customMargins;
      default:
        return { top: 0, bottom: 0, left: 0, right: 0 };
    }
  }, [preset, customMargins]);

  const firstPageDims = effectiveDimensions.length > 0 ? effectiveDimensions[0] : null;
  const croppedWidth = firstPageDims ? Math.max(0, firstPageDims.width - currentMargins.left - currentMargins.right) : 0;
  const croppedHeight = firstPageDims ? Math.max(0, firstPageDims.height - currentMargins.top - currentMargins.bottom) : 0;

  const handleCrop = async () => {
    if (files.length === 0) return;
    if (currentMargins.top + currentMargins.bottom + currentMargins.left + currentMargins.right === 0) {
      setError('No crop margins specified. Please select a preset or enter custom values.');
      return;
    }
    try {
      setProcessing('Cropping PDF...');
      setProgress(20, 'Reading document...');

      let pageIndices: number[] | undefined;
      if (!applyToAll && pageRange.trim()) {
        pageIndices = parsePageInput(pageRange, effectiveDimensions.length);
        if (pageIndices.length === 0) {
          setError('No valid pages specified in range.');
          return;
        }
      }

      setProgress(50, 'Applying crop...');
      const result = await cropPDF(files[0].data, {
        top: currentMargins.top,
        bottom: currentMargins.bottom,
        left: currentMargins.left,
        right: currentMargins.right,
        pageIndices,
      });

      setProgress(90, 'Creating cropped file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `cropped-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crop PDF');
    }
  };

  const hasCrop = currentMargins.top + currentMargins.bottom + currentMargins.left + currentMargins.right > 0;

  return (
    <ToolPage
      toolId="crop-pdf"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleCrop}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || !hasCrop}
        >
          <Crop className="h-4 w-4 mr-2" />
          Crop PDF
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Page dimensions info */}
        {firstPageDims && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 text-fuchsia-500 dark:text-fuchsia-400 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">Page Dimensions</p>
                  <p className="text-muted-foreground">
                    {firstPageDims.width.toFixed(1)} × {firstPageDims.height.toFixed(1)} pt
                    <span className="mx-2">·</span>
                    {(firstPageDims.width / 72).toFixed(1)} × {(firstPageDims.height / 72).toFixed(1)} in
                  </p>
                  {effectiveDimensions.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {effectiveDimensions.length} pages in document
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-fuchsia-500 dark:text-fuchsia-400 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Crop PDF page margins by specifying how much to remove from each side. Margins are specified in points (1 inch = 72 points).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preset selection */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Crop className="h-4 w-4 text-fuchsia-500" />
            Crop Preset
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { id: 'none' as CropPreset, label: 'No Crop', desc: 'Original size', margin: 0 },
              { id: 'remove-margins' as CropPreset, label: 'Remove Margins', desc: '36 pt each side', margin: 36 },
              { id: 'tight' as CropPreset, label: 'Tight Crop', desc: '54 pt each side', margin: 54 },
              { id: 'custom' as CropPreset, label: 'Custom', desc: 'Set your own', margin: 0 },
            ]).map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 ${
                  preset === p.id
                    ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30 dark:border-fuchsia-400'
                    : 'border-muted hover:border-fuchsia-300 dark:hover:border-fuchsia-700'
                }`}
              >
                <span className={`text-sm font-medium ${preset === p.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {p.label}
                </span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom margin inputs */}
        {preset === 'custom' && (
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-sm">Custom Margins (points)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margin-top" className="text-xs">Top</Label>
                <Input
                  id="margin-top"
                  type="number"
                  min={0}
                  value={customMargins.top}
                  onChange={(e) => setCustomMargins((m) => ({ ...m, top: Math.max(0, Number(e.target.value)) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin-bottom" className="text-xs">Bottom</Label>
                <Input
                  id="margin-bottom"
                  type="number"
                  min={0}
                  value={customMargins.bottom}
                  onChange={(e) => setCustomMargins((m) => ({ ...m, bottom: Math.max(0, Number(e.target.value)) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin-left" className="text-xs">Left</Label>
                <Input
                  id="margin-left"
                  type="number"
                  min={0}
                  value={customMargins.left}
                  onChange={(e) => setCustomMargins((m) => ({ ...m, left: Math.max(0, Number(e.target.value)) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin-right" className="text-xs">Right</Label>
                <Input
                  id="margin-right"
                  type="number"
                  min={0}
                  value={customMargins.right}
                  onChange={(e) => setCustomMargins((m) => ({ ...m, right: Math.max(0, Number(e.target.value)) }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Visual preview */}
        {firstPageDims && hasCrop && (
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-sm">Crop Preview</h3>
            <div className="flex items-center justify-center">
              <div className="relative bg-muted/30 border-2 border-muted rounded" style={{ width: 200, height: 200 * (firstPageDims.height / firstPageDims.width) }}>
                {/* Crop area overlay */}
                <div
                  className="absolute bg-fuchsia-100/60 dark:bg-fuchsia-900/30 border-2 border-fuchsia-500 border-dashed"
                  style={{
                    top: `${(currentMargins.top / firstPageDims.height) * 100}%`,
                    left: `${(currentMargins.left / firstPageDims.width) * 100}%`,
                    right: `${(currentMargins.right / firstPageDims.width) * 100}%`,
                    bottom: `${(currentMargins.bottom / firstPageDims.height) * 100}%`,
                  }}
                />
                {/* Margins labels */}
                {currentMargins.top > 0 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-medium bg-background/80 px-1 rounded" style={{ marginTop: `${(currentMargins.top / firstPageDims.height) * 100 / 2}%` }}>
                    {currentMargins.top}pt
                  </div>
                )}
                {currentMargins.bottom > 0 && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-medium bg-background/80 px-1 rounded" style={{ marginBottom: `${(currentMargins.bottom / firstPageDims.height) * 100 / 2}%` }}>
                    {currentMargins.bottom}pt
                  </div>
                )}
                {/* FileText icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline">
                Original: {firstPageDims.width.toFixed(0)} × {firstPageDims.height.toFixed(0)} pt
              </Badge>
              <Badge variant="outline" className="border-fuchsia-300 dark:border-fuchsia-700">
                Cropped: {croppedWidth.toFixed(0)} × {croppedHeight.toFixed(0)} pt
              </Badge>
            </div>
          </div>
        )}

        {/* Apply to pages */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Apply To</h3>
          <div className="flex items-center gap-3">
            <Button
              variant={applyToAll ? 'default' : 'outline'}
              size="sm"
              onClick={() => setApplyToAll(true)}
            >
              All Pages
            </Button>
            <Button
              variant={!applyToAll ? 'default' : 'outline'}
              size="sm"
              onClick={() => setApplyToAll(false)}
            >
              Specific Pages
            </Button>
          </div>
          {!applyToAll && (
            <div className="space-y-2">
              <Label htmlFor="page-range" className="text-xs">Page Range</Label>
              <Input
                id="page-range"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1,3,5-8"
              />
              <p className="text-xs text-muted-foreground">
                Enter page numbers separated by commas. Use dashes for ranges (e.g., 1-5).
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolPage>
  );
}

function parsePageInput(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const num = parseInt(trimmed);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
