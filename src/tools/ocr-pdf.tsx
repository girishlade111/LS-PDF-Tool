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
  Languages,
} from 'lucide-react';

type Quality = 'standard' | 'high';
type Language = 'auto' | 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

const languageOptions: { value: Language; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

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
  const [language, setLanguage] = useState<Language>('auto');
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
      setProcessing('Running OCR on PDF...');

      // Dynamic import of pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const totalPages = pdf.numPages;
      const targetPages = parsePageRange(pageRange, totalPages);

      if (targetPages.length === 0) {
        setError('No valid pages found in the specified range');
        setIsProcessing(false);
        return;
      }

      const scale = quality === 'high' ? 2 : 1;
      const images: string[] = [];
      const pageNums: number[] = [];

      // Render pages as images
      for (let idx = 0; idx < targetPages.length; idx++) {
        const pageNum = targetPages[idx];
        const progressPct = Math.round(((idx + 1) / targetPages.length) * 40);
        setProgressValue(progressPct);
        setProgressMessage(
          `Rendering page ${pageNum} of ${targetPages.length}...`
        );
        setProgress(progressPct, `Rendering page ${pageNum}...`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        images.push(dataUrl);
        pageNums.push(pageNum);
      }

      // Send to API for AI OCR processing (one page at a time)
      const results: { pageNumber: number; text: string }[] = [];

      for (let idx = 0; idx < images.length; idx++) {
        const baseProgress = 40;
        const progressPct =
          baseProgress +
          Math.round(((idx + 1) / images.length) * 55);
        setProgressValue(progressPct);
        setProgressMessage(
          `AI processing page ${pageNums[idx]} (${idx + 1}/${images.length})...`
        );
        setProgress(progressPct, `AI processing page ${pageNums[idx]}...`);

        try {
          const response = await fetch('/api/ocr-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: [images[idx]],
              pageNumbers: [pageNums[idx]],
              language:
                language === 'auto'
                  ? 'auto'
                  : languageOptions.find((l) => l.value === language)?.label ||
                    language,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(
              errData.error || `API error: ${response.status}`
            );
          }

          const data = await response.json();
          if (data.pages && data.pages.length > 0) {
            results.push(data.pages[0]);
          }
        } catch (pageErr) {
          results.push({
            pageNumber: pageNums[idx],
            text: `[Error processing page ${pageNums[idx]}: ${pageErr instanceof Error ? pageErr.message : 'Unknown error'}]`,
          });
        }
      }

      setPageResults(results);
      setProgressValue(100);
      setProgressMessage('OCR complete!');
      setProgress(100, 'OCR complete!');

      // Create a downloadable blob
      const textBlob = new Blob([allText], { type: 'text/plain' });
      const { setSuccess } = useFileStore.getState();
      setSuccess({
        blob: textBlob,
        filename: `${files[0].name.replace('.pdf', '')}-ocr.txt`,
        size: textBlob.size,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to perform OCR on PDF'
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
      {/* AI-Powered Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI-Powered
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
              OCR Another
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
                <p className="text-sm font-medium">AI-Powered OCR</p>
                <p className="text-sm text-muted-foreground">
                  Upload a scanned PDF and our AI will extract text from each
                  page, preserving layout and formatting as much as possible.
                </p>
              </div>
            </div>
          </div>

          {/* Language selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" />
              Document Language
            </label>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    language === lang.value
                      ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                      : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rendering Quality</label>
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
                  1x scale — Faster processing
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
                  2x scale — Better quality
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
