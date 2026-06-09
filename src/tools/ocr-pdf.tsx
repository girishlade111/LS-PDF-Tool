'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Copy,
  Download,
  Check,
  Zap,
  Gem,
  Type,
  Info,
} from 'lucide-react';
import { getPdfjs } from '@/lib/pdf-worker';

type Quality = 'standard' | 'high';

function parsePageRange(input: string, totalPages: number): number[] {
  if (!input.trim() || input.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = input.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function OCRPDFTool() {
  const { files, setProcessing, setProgress, setError, resetProcessing } =
    useFileStore();
  const [quality, setQuality] = useState<Quality>('standard');
  const [pageRange, setPageRange] = useState('all');
  const [pageResults, setPageResults] = useState<
    { pageNumber: number; text: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const allText = pageResults
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n');

  const wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;
  const charCount = allText.length;

  const handleOCR = async () => {
    if (files.length === 0) return;
    try {
      setIsProcessing(true);
      setProgressValue(0);
      setProgressMessage('Loading PDF...');
      setPageResults([]);
      setProcessing('Extracting text from PDF...');

      const pdfjsLib = await getPdfjs();

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const totalPages = pdf.numPages;
      const targetPages = parsePageRange(pageRange, totalPages);

      if (targetPages.length === 0) {
        setError('No valid pages found in the specified range');
        setIsProcessing(false);
        return;
      }

      const results: { pageNumber: number; text: string }[] = [];

      // Extract text from each page using pdfjs-dist (client-side)
      for (let idx = 0; idx < targetPages.length; idx++) {
        const pageNum = targetPages[idx];
        const progressPct = Math.round(((idx + 1) / targetPages.length) * 90);
        setProgressValue(progressPct);
        setProgressMessage(
          `Extracting text from page ${pageNum} (${idx + 1}/${targetPages.length})...`
        );
        setProgress(progressPct, `Extracting page ${pageNum}...`);

        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Group text items into lines based on Y position
          const items = textContent.items
            .filter((item): item is { str: string; transform: number[]; width: number; height: number } => 'str' in item);

          // Build text preserving some layout
          let pageText = '';
          let lastY: number | null = null;

          for (const item of items) {
            const y = Math.round(item.transform[5]);
            if (lastY !== null && Math.abs(y - lastY) > 5) {
              pageText += '\n';
            } else if (lastY !== null && pageText.length > 0 && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            pageText += item.str;
            lastY = y;
          }

          results.push({
            pageNumber: pageNum,
            text: pageText.trim() || '[No text content found on this page]',
          });
        } catch (pageErr) {
          results.push({
            pageNumber: pageNum,
            text: `[Error extracting text from page ${pageNum}: ${pageErr instanceof Error ? pageErr.message : 'Unknown error'}]`,
          });
        }
      }

      setPageResults(results);
      setProgressValue(100);
      setProgressMessage('Text extraction complete!');
      setProgress(100, 'Text extraction complete!');

      // Build the final text from results (NOT from stale allText)
      const finalText = results
        .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
        .join('\n\n');

      const textBlob = new Blob([finalText], { type: 'text/plain' });
      const { setSuccess } = useFileStore.getState();
      setSuccess({
        blob: textBlob,
        filename: `${files[0].name.replace('.pdf', '')}-ocr.txt`,
        size: textBlob.size,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to extract text from PDF'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = allText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      files.length > 0
        ? `${files[0].name.replace('.pdf', '')}-ocr.txt`
        : 'ocr-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetProcessing();
    setPageResults([]);
    setProgressValue(0);
    setProgressMessage('');
    setCopied(false);
  };

  return (
    <ToolPage
      toolId="ocr-pdf"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleOCR}
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          disabled={files.length === 0 || isProcessing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Extract Text (OCR)
        </Button>
      }
    >
      {/* Info badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Client-Side Text Extraction
        </Badge>
      </div>

      {pageResults.length > 0 ? (
        /* Results view */
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Type className="h-3.5 w-3.5" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="text-sm text-muted-foreground">
              {charCount.toLocaleString()} characters
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="text-sm text-muted-foreground">
              {pageResults.length} page{pageResults.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download as TXT
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Extract Another
            </Button>
          </div>

          {/* Scrollable text area */}
          <Textarea
            value={allText}
            readOnly
            className="min-h-[300px] max-h-[500px] font-mono text-sm resize-y"
          />
        </div>
      ) : (
        /* Options view */
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Text Extraction (OCR)</p>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF and extract all embedded text content from each
                  page. Works entirely in your browser — no data is sent to any
                  server.
                </p>
              </div>
            </div>
          </div>

          {/* Note about scanned PDFs */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This tool extracts embedded text from PDFs. For scanned documents (image-only PDFs), text may not be available as the content is stored as images.
            </p>
          </div>

          {/* Quality selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Extraction Quality</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQuality('standard')}
                className={`rounded-lg border p-3 text-left transition-all ${
                  quality === 'standard'
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap
                    className={`h-4 w-4 ${quality === 'standard' ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}
                  />
                  <span className="text-sm font-medium">Standard</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fast text extraction
                </p>
              </button>
              <button
                onClick={() => setQuality('high')}
                className={`rounded-lg border p-3 text-left transition-all ${
                  quality === 'high'
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gem
                    className={`h-4 w-4 ${quality === 'high' ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}
                  />
                  <span className="text-sm font-medium">High</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Better layout preservation
                </p>
              </button>
            </div>
          </div>

          {/* Page range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Page Range</label>
            <Input
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="all or e.g., 1,3,5-8"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter &quot;all&quot; for all pages, or specific pages like
              &quot;1,3,5-8&quot;
            </p>
          </div>

          {/* Progress bar during processing */}
          {isProcessing && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progressMessage}
                  </span>
                  <span className="font-medium">{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </ToolPage>
  );
}
