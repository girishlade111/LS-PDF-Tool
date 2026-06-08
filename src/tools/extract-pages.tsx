'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { loadPDF } from '@/lib/pdf-utils';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, Info } from 'lucide-react';

export function ExtractPagesTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [pageInput, setPageInput] = useState('');

  const handleExtract = async () => {
    if (files.length === 0 || !pageInput.trim()) return;
    try {
      setProcessing('Extracting pages...');
      setProgress(20, 'Reading document...');
      
      const pdf = await loadPDF(files[0].data);
      const totalPages = pdf.getPageCount();
      
      // Parse page numbers from input like "1,3,5-8,10"
      const pageIndices = parsePageInput(pageInput, totalPages);
      
      if (pageIndices.length === 0) {
        setError('No valid pages specified');
        return;
      }
      
      setProgress(50, 'Extracting pages...');
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      setProgress(80, 'Creating document...');
      const result = await newPdf.save();
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `extracted-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract pages');
    }
  };

  return (
    <ToolPage
      toolId="extract-pages"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleExtract} size="lg" className="w-full sm:w-auto" disabled={files.length === 0 || !pageInput.trim()}>
          <Scissors className="h-4 w-4 mr-2" />
          Extract Pages
        </Button>
      }
    >
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-2">
          <Label>Pages to Extract</Label>
          <Input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="e.g., 1,3,5-8,10"
          />
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Enter page numbers separated by commas. Use dashes for ranges (e.g., 1-5). The selected pages will be extracted into a new PDF.</span>
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
          pages.add(i - 1); // 0-indexed
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
