'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { flattenPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Layers, Info, Zap, Sparkles } from 'lucide-react';

type QualityOption = 'standard' | 'high';

export function FlattenPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [flattenFormFields, setFlattenFormFields] = useState(true);
  const [flattenAnnotations, setFlattenAnnotations] = useState(true);
  const [flattenWatermarks, setFlattenWatermarks] = useState(false);
  const [quality, setQuality] = useState<QualityOption>('standard');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleFlatten = async () => {
    if (files.length === 0) return;
    if (!flattenFormFields && !flattenAnnotations && !flattenWatermarks) {
      setError('Please select at least one option to flatten.');
      return;
    }
    try {
      setProcessing('Flattening PDF...');
      setProcessingProgress(0);
      setProcessingMessage('Starting...');

      const result = await flattenPDF(files[0].data, {
        flattenFormFields,
        flattenAnnotations,
        flattenWatermarks,
        quality,
        onProgress: (page, total) => {
          const pct = Math.round((page / total) * 90);
          setProcessingProgress(pct);
          setProcessingMessage(`Processing page ${page} of ${total}...`);
          setProgress(pct, `Processing page ${page} of ${total}...`);
        },
      });

      setProcessingProgress(95);
      setProcessingMessage('Creating flattened file...');
      setProgress(95, 'Creating flattened file...');

      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `flattened-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flatten PDF');
    }
  };

  const isProcessing = useFileStore((s) => s.processingState === 'processing');

  return (
    <ToolPage
      toolId="flatten"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleFlatten}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || (!flattenFormFields && !flattenAnnotations && !flattenWatermarks)}
        >
          <Layers className="h-4 w-4 mr-2" />
          Flatten PDF
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Description card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Flattening a PDF merges form fields, annotations, and other interactive elements into the page content, making them non-editable.
                </p>
                <p>
                  This is useful when you want to finalize a document, prevent further editing, or ensure consistent display across all PDF viewers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <div className="rounded-2xl border bg-card p-5 space-y-5">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            Flatten Options
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="flatten-fields"
                checked={flattenFormFields}
                onCheckedChange={(checked) => setFlattenFormFields(checked === true)}
              />
              <Label htmlFor="flatten-fields" className="cursor-pointer text-sm">
                Flatten form fields
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              Make form fields non-editable by merging them into the page content.
            </p>

            <div className="flex items-center gap-3">
              <Checkbox
                id="flatten-annotations"
                checked={flattenAnnotations}
                onCheckedChange={(checked) => setFlattenAnnotations(checked === true)}
              />
              <Label htmlFor="flatten-annotations" className="cursor-pointer text-sm">
                Flatten annotations
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              Merge comments, highlights, and other annotations into the page.
            </p>

            <div className="flex items-center gap-3">
              <Checkbox
                id="flatten-watermarks"
                checked={flattenWatermarks}
                onCheckedChange={(checked) => setFlattenWatermarks(checked === true)}
              />
              <Label htmlFor="flatten-watermarks" className="cursor-pointer text-sm">
                Flatten watermarks
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              Bake watermarks into the page content so they cannot be removed separately.
            </p>
          </div>
        </div>

        {/* Quality selection */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-500" />
            Render Quality
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQuality('standard')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                quality === 'standard'
                  ? 'border-slate-500 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-400'
                  : 'border-muted hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Zap className={`h-6 w-6 ${quality === 'standard' ? 'text-slate-600 dark:text-slate-300' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${quality === 'standard' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Standard
              </span>
              <span className="text-xs text-muted-foreground">Faster processing</span>
            </button>

            <button
              onClick={() => setQuality('high')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                quality === 'high'
                  ? 'border-slate-500 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-400'
                  : 'border-muted hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Sparkles className={`h-6 w-6 ${quality === 'high' ? 'text-slate-600 dark:text-slate-300' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${quality === 'high' ? 'text-foreground' : 'text-muted-foreground'}`}>
                High
              </span>
              <span className="text-xs text-muted-foreground">Better quality output</span>
            </button>
          </div>
        </div>

        {/* Progress bar during processing */}
        {isProcessing && (
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{processingMessage}</span>
              <span className="font-medium">{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} />
          </div>
        )}
      </div>
    </ToolPage>
  );
}
