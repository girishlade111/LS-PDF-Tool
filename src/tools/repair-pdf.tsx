'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { repairPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wrench, Info, Settings, FileWarning, GitBranch, Tag } from 'lucide-react';

export function RepairPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [rebuildXRef, setRebuildXRef] = useState(true);
  const [removeCorrupted, setRemoveCorrupted] = useState(true);
  const [fixPageTree, setFixPageTree] = useState(true);
  const [stripInvalidMetadata, setStripInvalidMetadata] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [repairMessage, setRepairMessage] = useState('');

  const handleRepair = async () => {
    if (files.length === 0) return;
    if (!rebuildXRef && !removeCorrupted && !fixPageTree && !stripInvalidMetadata) {
      setError('Please select at least one repair option.');
      return;
    }
    try {
      setProcessing('Repairing PDF...');
      setRepairProgress(0);
      setRepairMessage('Analyzing document structure...');

      setProgress(20, 'Reading document...');
      setRepairProgress(20);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setRepairProgress(50);
      setRepairMessage('Rebuilding PDF structure...');
      setProgress(50, 'Rebuilding PDF structure...');

      const result = await repairPDF(files[0].data, {
        rebuildXRef,
        removeCorrupted,
        fixPageTree,
        stripInvalidMetadata,
      });

      setRepairProgress(90);
      setRepairMessage('Finalizing repaired file...');
      setProgress(90, 'Finalizing repaired file...');

      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `repaired-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to repair PDF');
    }
  };

  const isProcessing = useFileStore((s) => s.processingState === 'processing');

  return (
    <ToolPage
      toolId="repair"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleRepair}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || (!rebuildXRef && !removeCorrupted && !fixPageTree && !stripInvalidMetadata)}
        >
          <Wrench className="h-4 w-4 mr-2" />
          Repair PDF
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Info card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Repairing a PDF rebuilds the document structure by copying all pages to a fresh document. This removes corrupted objects, fixes broken cross-references, and ensures the page tree is valid.
                </p>
                <p>
                  This is useful for PDFs that won&apos;t open, display incorrectly, or cause errors in PDF readers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repair options */}
        <div className="rounded-2xl border bg-card p-5 space-y-5">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            Repair Options
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="rebuild-xref"
                checked={rebuildXRef}
                onCheckedChange={(checked) => setRebuildXRef(checked === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="rebuild-xref" className="cursor-pointer text-sm flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-orange-500" />
                  Rebuild cross-reference table
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reconstruct the PDF cross-reference table, which maps object offsets for random access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="remove-corrupted"
                checked={removeCorrupted}
                onCheckedChange={(checked) => setRemoveCorrupted(checked === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="remove-corrupted" className="cursor-pointer text-sm flex items-center gap-2">
                  <FileWarning className="h-3.5 w-3.5 text-orange-500" />
                  Remove corrupted objects
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Remove unreferenced and corrupted objects by copying only valid page content.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="fix-page-tree"
                checked={fixPageTree}
                onCheckedChange={(checked) => setFixPageTree(checked === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="fix-page-tree" className="cursor-pointer text-sm flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-orange-500" />
                  Fix page tree structure
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rebuild the page tree to ensure all pages are correctly linked and ordered.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="strip-metadata"
                checked={stripInvalidMetadata}
                onCheckedChange={(checked) => setStripInvalidMetadata(checked === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="strip-metadata" className="cursor-pointer text-sm flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-orange-500" />
                  Strip invalid metadata
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reset metadata fields that may contain corrupted or invalid values.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar during processing */}
        {isProcessing && (
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{repairMessage}</span>
              <span className="font-medium">{repairProgress}%</span>
            </div>
            <Progress value={repairProgress} />
          </div>
        )}
      </div>
    </ToolPage>
  );
}
