'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Sparkles,
  Copy,
  Download,
  Check,
  Zap,
  Gem,
  Briefcase,
  FileText,
  List,
  Type,
} from 'lucide-react';

type SummaryType = 'brief' | 'detailed' | 'key-points';
type Quality = 'standard' | 'high';

interface PageSummary {
  pageNumber: number;
  summary: string;
}

const summaryTypeOptions: {
  value: SummaryType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'brief',
    label: 'Brief Summary',
    description: 'Quick 2-3 sentence overview',
    icon: Briefcase,
  },
  {
    value: 'detailed',
    label: 'Detailed Summary',
    description: 'Comprehensive summary with all details',
    icon: FileText,
  },
  {
    value: 'key-points',
    label: 'Key Points',
    description: 'Numbered list of key takeaways',
    icon: List,
  },
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

export function SummarizePDFTool() {
  const { files, setProcessing, setProgress, setError, resetProcessing } =
    useFileStore();
  const [summaryType, setSummaryType] = useState<SummaryType>('brief');
  const [quality, setQuality] = useState<Quality>('standard');
  const [pageRange, setPageRange] = useState('all');
  const [summary, setSummary] = useState('');
  const [pageSummaries, setPageSummaries] = useState<PageSummary[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const handleSummarize = async () => {
    if (files.length === 0) return;
    try {
      setIsProcessing(true);
      setProgressValue(0);
      setProgressMessage('Loading PDF...');
      setSummary('');
      setPageSummaries([]);
      setProcessing('Summarizing PDF with AI...');

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
        const progressPct = Math.round(((idx + 1) / targetPages.length) * 30);
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

      // Send all images to API for AI summarization
      setProgressValue(35);
      setProgressMessage('AI is analyzing your document...');
      setProgress(35, 'AI is analyzing your document...');

      const response = await fetch('/api/summarize-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          pageNumbers: pageNums,
          summaryType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      setSummary(data.summary || '');
      setPageSummaries(data.pageSummaries || []);
      setProgressValue(100);
      setProgressMessage('Summary complete!');
      setProgress(100, 'Summary complete!');

      // Create a downloadable blob for the result
      const textBlob = new Blob([data.summary || ''], { type: 'text/plain' });
      const { setSuccess } = useFileStore.getState();
      setSuccess({
        blob: textBlob,
        filename: `${files[0].name.replace('.pdf', '')}-summary.txt`,
        size: textBlob.size,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to summarize PDF'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      files.length > 0
        ? `${files[0].name.replace('.pdf', '')}-summary.txt`
        : 'summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetProcessing();
    setSummary('');
    setPageSummaries([]);
    setProgressValue(0);
    setProgressMessage('');
    setCopied(false);
  };

  return (
    <ToolPage
      toolId="summarize-pdf"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleSummarize}
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
          disabled={files.length === 0 || isProcessing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Summarize PDF
        </Button>
      }
    >
      {/* AI-Powered Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      {summary ? (
        /* Results view */
        <div className="space-y-6">
          {/* Combined summary card with gradient border */}
          <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
            <div className="rounded-xl bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-lg font-semibold">Document Summary</h3>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                >
                  {summaryType === 'brief'
                    ? 'Brief'
                    : summaryType === 'detailed'
                      ? 'Detailed'
                      : 'Key Points'}
                </Badge>
              </div>

              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Type className="h-3.5 w-3.5" />
                  <span>{wordCount.toLocaleString()} words</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="text-sm text-muted-foreground">
                  {pageSummaries.length} page
                  {pageSummaries.length !== 1 ? 's' : ''} analyzed
                </div>
              </div>
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
                  Copy Summary
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download as TXT
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Summarize Another
            </Button>
          </div>

          {/* Per-page summaries in collapsible accordion */}
          {pageSummaries.length > 1 && (
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="page-summaries" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Per-Page Summaries</span>
                    <Badge variant="secondary" className="text-xs ml-1">
                      {pageSummaries.length} pages
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {pageSummaries.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="rounded-lg border bg-muted/30 p-4 space-y-1"
                      >
                        <Badge variant="outline" className="text-xs mb-2">
                          Page {page.pageNumber}
                        </Badge>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {page.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      ) : (
        /* Options view */
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">AI-Powered PDF Summarization</p>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF and our AI will analyze each page and generate a
                  cohesive document summary. Choose the summary style that fits
                  your needs.
                </p>
              </div>
            </div>
          </div>

          {/* Summary type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Summary Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {summaryTypeOptions.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSummaryType(option.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      summaryType === option.value
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <OptionIcon
                        className={`h-4 w-4 ${
                          summaryType === option.value
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
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
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap
                    className={`h-4 w-4 ${
                      quality === 'standard'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}
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
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gem
                    className={`h-4 w-4 ${
                      quality === 'high'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}
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
