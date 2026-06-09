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
  Briefcase,
  FileText,
  List,
  Type,
  Info,
} from 'lucide-react';
import { getPdfjs } from '@/lib/pdf-worker';

type SummaryType = 'brief' | 'detailed' | 'key-points';

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
    description: 'Short overview of content',
    icon: Briefcase,
  },
  {
    value: 'detailed',
    label: 'Detailed Summary',
    description: 'Comprehensive text extraction',
    icon: FileText,
  },
  {
    value: 'key-points',
    label: 'Key Points',
    description: 'Extracted sentences and headings',
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

/**
 * Client-side summarization: extract key sentences from text.
 * This is a heuristic approach — not AI — but works entirely offline.
 */
function generateSummary(
  pageTexts: { pageNumber: number; text: string }[],
  type: SummaryType
): { summary: string; pageSummaries: PageSummary[] } {
  const pageSummaries: PageSummary[] = [];

  for (const page of pageTexts) {
    const text = page.text.trim();
    if (!text || text === '[No text content found on this page]') {
      pageSummaries.push({ pageNumber: page.pageNumber, summary: '[No text content on this page]' });
      continue;
    }

    // Split into sentences
    const sentences = text
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    if (type === 'brief') {
      // Take first 2-3 sentences per page
      const briefSentences = sentences.slice(0, 3);
      pageSummaries.push({
        pageNumber: page.pageNumber,
        summary: briefSentences.join(' ') || text.slice(0, 200),
      });
    } else if (type === 'key-points') {
      // Extract sentences that look like key points (contain keywords, start with caps, etc.)
      const keyPoints = sentences
        .filter((s) => {
          const isHeading = s.length < 80 && /^[A-Z]/.test(s);
          const hasKeywords = /\b(important|key|main|summary|conclusion|result|note|critical|essential)\b/i.test(s);
          return isHeading || hasKeywords;
        })
        .slice(0, 5);

      // If no key points found, take first few sentences
      const points = keyPoints.length > 0 ? keyPoints : sentences.slice(0, 4);
      pageSummaries.push({
        pageNumber: page.pageNumber,
        summary: points.map((p, i) => `${i + 1}. ${p}`).join('\n'),
      });
    } else {
      // Detailed: include more text
      const detailedSentences = sentences.slice(0, 8);
      pageSummaries.push({
        pageNumber: page.pageNumber,
        summary: detailedSentences.join(' ') || text.slice(0, 500),
      });
    }
  }

  // Build overall summary
  const overallParts = pageSummaries
    .filter((p) => !p.summary.startsWith('[No text'))
    .map((p) => p.summary);

  let summary: string;
  if (type === 'brief') {
    // Take first sentence from each page, up to 5
    summary = overallParts.slice(0, 5).join('\n\n');
  } else if (type === 'key-points') {
    summary = overallParts.join('\n\n');
  } else {
    summary = overallParts.join('\n\n---\n\n');
  }

  return {
    summary: summary || 'No text content could be extracted from this PDF.',
    pageSummaries,
  };
}

export function SummarizePDFTool() {
  const { files, setProcessing, setProgress, setError, resetProcessing } =
    useFileStore();
  const [summaryType, setSummaryType] = useState<SummaryType>('brief');
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
      setProcessing('Summarizing PDF...');

      const pdfjsLib = await getPdfjs();

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const totalPages = pdf.numPages;
      const targetPages = parsePageRange(pageRange, totalPages);

      if (targetPages.length === 0) {
        setError('No valid pages found in the specified range');
        setIsProcessing(false);
        return;
      }

      const pageTexts: { pageNumber: number; text: string }[] = [];

      // Extract text from each page
      for (let idx = 0; idx < targetPages.length; idx++) {
        const pageNum = targetPages[idx];
        const progressPct = Math.round(((idx + 1) / targetPages.length) * 70);
        setProgressValue(progressPct);
        setProgressMessage(`Extracting page ${pageNum} of ${targetPages.length}...`);
        setProgress(progressPct, `Extracting page ${pageNum}...`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const items = textContent.items
          .filter((item): item is { str: string; transform: number[] } => 'str' in item);

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

        pageTexts.push({
          pageNumber: pageNum,
          text: pageText.trim() || '[No text content found on this page]',
        });
      }

      setProgressValue(80);
      setProgressMessage('Generating summary...');
      setProgress(80, 'Generating summary...');

      // Generate client-side summary
      const result = generateSummary(pageTexts, summaryType);

      setSummary(result.summary);
      setPageSummaries(result.pageSummaries);
      setProgressValue(100);
      setProgressMessage('Summary complete!');
      setProgress(100, 'Summary complete!');

      // Create download blob from the generated summary (NOT stale state)
      const textBlob = new Blob([result.summary], { type: 'text/plain' });
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
      {/* Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Client-Side Summarization
        </Badge>
      </div>

      {summary ? (
        /* Results view */
        <div className="space-y-6">
          {/* Combined summary card */}
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

          {/* Per-page summaries */}
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
                <p className="text-sm font-medium">PDF Summarization</p>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF and get a summary of its text content.
                  Extracts key sentences and organizes them by page — all
                  processed locally in your browser.
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Summarization uses heuristic text extraction. Results work best with text-rich documents.
            </p>
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
