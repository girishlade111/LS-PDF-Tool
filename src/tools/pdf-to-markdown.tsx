'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  Check,
  Zap,
  Gem,
  Eye,
  Code,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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

export function PDFToMarkdownTool() {
  const { files, setProcessing, setProgress, setError, resetProcessing } =
    useFileStore();
  const [quality, setQuality] = useState<Quality>('standard');
  const [pageRange, setPageRange] = useState('all');
  const [pageResults, setPageResults] = useState<
    { pageNumber: number; markdown: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  const allMarkdown = pageResults.map((p) => p.markdown).join('\n\n---\n\n');

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setIsProcessing(true);
      setProgressValue(0);
      setProgressMessage('Loading PDF...');
      setPageResults([]);
      setProcessing('Converting PDF to Markdown...');

      const pdfjsLib = await getPdfjs();

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const totalPages = pdf.numPages;
      const targetPages = parsePageRange(pageRange, totalPages);

      if (targetPages.length === 0) {
        setError('No valid pages found in the specified range');
        setIsProcessing(false);
        return;
      }

      const results: { pageNumber: number; markdown: string }[] = [];

      // Extract text and convert to markdown (client-side)
      for (let idx = 0; idx < targetPages.length; idx++) {
        const pageNum = targetPages[idx];
        const progressPct = Math.round(((idx + 1) / targetPages.length) * 90);
        setProgressValue(progressPct);
        setProgressMessage(
          `Converting page ${pageNum} (${idx + 1}/${targetPages.length})...`
        );
        setProgress(progressPct, `Converting page ${pageNum}...`);

        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const items = textContent.items
            .filter((item): item is { str: string; transform: number[]; width: number; height: number } => 'str' in item);

          // Group items into lines by Y position, detect font sizes for headings
          let markdown = '';
          let lastY: number | null = null;
          let currentLine = '';
          let currentFontSize = 0;
          const lines: { text: string; fontSize: number }[] = [];

          for (const item of items) {
            const y = Math.round(item.transform[5]);
            const fontSize = Math.round(Math.abs(item.transform[0]) || 12);

            if (lastY !== null && Math.abs(y - lastY) > 3) {
              // New line
              if (currentLine.trim()) {
                lines.push({ text: currentLine.trim(), fontSize: currentFontSize });
              }
              currentLine = item.str;
              currentFontSize = fontSize;
            } else {
              if (currentLine && !currentLine.endsWith(' ') && item.str && !item.str.startsWith(' ')) {
                currentLine += ' ';
              }
              currentLine += item.str;
              currentFontSize = Math.max(currentFontSize, fontSize);
            }
            lastY = y;
          }
          if (currentLine.trim()) {
            lines.push({ text: currentLine.trim(), fontSize: currentFontSize });
          }

          // Determine median font size to detect headings
          const fontSizes = lines.map((l) => l.fontSize).filter((s) => s > 0);
          const medianFontSize = fontSizes.length > 0
            ? fontSizes.sort((a, b) => a - b)[Math.floor(fontSizes.length / 2)]
            : 12;

          // Convert lines to markdown
          for (const line of lines) {
            const text = line.text;
            if (!text) {
              markdown += '\n';
              continue;
            }

            if (line.fontSize > medianFontSize * 1.5) {
              markdown += `# ${text}\n\n`;
            } else if (line.fontSize > medianFontSize * 1.2) {
              markdown += `## ${text}\n\n`;
            } else if (line.fontSize > medianFontSize * 1.05) {
              markdown += `### ${text}\n\n`;
            } else if (/^\d+\.\s/.test(text)) {
              // Numbered list
              markdown += `${text}\n`;
            } else if (/^[•\-\*]\s/.test(text)) {
              // Bullet list
              markdown += `- ${text.replace(/^[•\-\*]\s*/, '')}\n`;
            } else {
              markdown += `${text}\n\n`;
            }
          }

          results.push({
            pageNumber: pageNum,
            markdown: markdown.trim() || '*[No text content found on this page]*',
          });
        } catch (pageErr) {
          results.push({
            pageNumber: pageNum,
            markdown: `> **Error processing page ${pageNum}:** ${pageErr instanceof Error ? pageErr.message : 'Unknown error'}`,
          });
        }
      }

      setPageResults(results);
      setProgressValue(100);
      setProgressMessage('Conversion complete!');
      setProgress(100, 'Conversion complete!');

      // Create a downloadable blob from results (NOT stale allMarkdown)
      const finalMarkdown = results.map((p) => p.markdown).join('\n\n---\n\n');
      const markdownBlob = new Blob([finalMarkdown], { type: 'text/markdown' });

      const { setSuccess } = useFileStore.getState();
      setSuccess({
        blob: markdownBlob,
        filename: `${files[0].name.replace('.pdf', '')}.md`,
        size: markdownBlob.size,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to convert PDF to Markdown'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = allMarkdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([allMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      files.length > 0
        ? `${files[0].name.replace('.pdf', '')}.md`
        : 'converted.md';
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
      toolId="pdf-to-markdown"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleConvert}
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
          disabled={files.length === 0 || isProcessing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Convert to Markdown
        </Button>
      }
    >
      {/* AI-Powered Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Client-Side Conversion
        </Badge>
      </div>

      {pageResults.length > 0 ? (
        /* Results view */
        <div className="space-y-4">
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
                  Copy Markdown
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadMd}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download .md
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'source' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('source')}
            >
              <Code className="h-3.5 w-3.5 mr-1.5" />
              Source
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Convert Another
            </Button>
          </div>

          {/* Page results */}
          <ScrollArea className="max-h-[600px] rounded-lg border">
            <div className="p-4 space-y-6">
              {pageResults.map((page) => (
                <div key={page.pageNumber} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Page {page.pageNumber}
                    </Badge>
                  </div>
                  {viewMode === 'preview' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-background p-4">
                      <ReactMarkdown>{page.markdown}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="rounded-lg border bg-muted/30 p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                      {page.markdown}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        /* Options view */
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">PDF to Markdown Conversion</p>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF and convert each page to clean Markdown format.
                  Detects headings, lists, and paragraphs based on text layout.
                  Processed entirely in your browser.
                </p>
              </div>
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
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-1 ring-teal-500'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap
                    className={`h-4 w-4 ${quality === 'standard' ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}`}
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
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-1 ring-teal-500'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gem
                    className={`h-4 w-4 ${quality === 'high' ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}`}
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
