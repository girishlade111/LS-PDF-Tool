'use client';

import React from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { mergePDFs, formatFileSize } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Merge } from 'lucide-react';

export function MergePDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();

  const handleMerge = async () => {
    if (files.length < 2) return;
    try {
      setProcessing('Merging PDFs...');
      setProgress(30, 'Reading files...');
      const result = await mergePDFs(files.map((f) => f.data));
      setProgress(80, 'Creating merged file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: 'merged.pdf',
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs');
    }
  };

  return (
    <ToolPage
      toolId="merge"
      multiple={true}
      maxFiles={20}
      actionButton={
        <Button onClick={handleMerge} size="lg" className="w-full sm:w-auto" disabled={files.length < 2}>
          <Merge className="h-4 w-4 mr-2" />
          Merge {files.length} PDF{files.length !== 1 ? 's' : ''}
        </Button>
      }
    >
      <div />
    </ToolPage>
  );
}
