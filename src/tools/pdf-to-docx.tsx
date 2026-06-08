'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileOutput,
  Sparkles,
  Copy,
  Download,
  Check,
  Zap,
  Gem,
  Crown,
  Type,
} from 'lucide-react';

type Quality = 'standard' | 'high' | 'ultra';

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

function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities in content (but not our generated tags)
  // We'll process in order from most specific to least specific

  // Tables (pipe-separated) - convert to HTML table
  html = html.replace(
    /(?:^|\n)((?:\|[^\n]+\|\n)+)/g,
    (_match, tableBlock: string) => {
      const rows = tableBlock.trim().split('\n');
      let tableHtml = '<table>';
      rows.forEach((row: string, idx: number) => {
        // Skip separator rows (|---|---|)
        if (/^\|[\s-:|]+\|$/.test(row)) return;
        const cells = row
          .split('|')
          .filter((c: string) => c.trim() !== '')
          .map((c: string) => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += '<tr>' + cells.map((c: string) => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
      });
      tableHtml += '</table>';
      return '\n' + tableHtml + '\n';
    }
  );

  // Headings (must be before paragraph handling)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');

  // Bullet lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> items in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');

  // Paragraphs: wrap remaining text blocks in <p> tags
  html = html.replace(/\n\n(?!<)/g, '</p>\n<p>');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function createDocContent(html: string, title: string): string {
  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: Calibri, Candara, Segoe, 'Segoe UI', Optima, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 1in 1in 1in 1in;
    }
    h1 {
      font-size: 18pt;
      color: #1a1a1a;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 14pt;
      color: #2a2a2a;
      font-weight: bold;
      margin-top: 14pt;
      margin-bottom: 4pt;
    }
    h3 {
      font-size: 12pt;
      color: #3a3a3a;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 4pt;
    }
    p {
      margin-top: 4pt;
      margin-bottom: 4pt;
    }
    ul, ol {
      margin-top: 4pt;
      margin-bottom: 4pt;
      padding-left: 24pt;
    }
    li {
      margin-top: 2pt;
      margin-bottom: 2pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 8pt;
      margin-bottom: 8pt;
    }
    td, th {
      border: 1px solid #d0d0d0;
      padding: 6pt 8pt;
      vertical-align: top;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    blockquote {
      border-left: 3pt solid #d0d0d0;
      padding-left: 12pt;
      margin-left: 0;
      color: #555;
      font-style: italic;
    }
    hr {
      border: none;
      border-top: 1pt solid #d0d0d0;
      margin-top: 12pt;
      margin-bottom: 12pt;
    }
    @page {
      size: A4;
      margin: 1in;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

export function PDFToDOCXTool() {
  const { files, setProcessing, setProgress, setError, resetProcessing } =
    useFileStore();
  const [quality, setQuality] = useState<Quality>('standard');
  const [pageRange, setPageRange] = useState('all');
  const [pageResults, setPageResults] = useState<
    { pageNumber: number; content: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const allContent = pageResults
    .map((p) => p.content)
    .join('\n\n---\n\n');

  const wordCount = allContent.trim() ? allContent.trim().split(/\s+/).length : 0;
  const charCount = allContent.length;

  const scaleMap: Record<Quality, number> = {
    standard: 1,
    high: 2,
    ultra: 3,
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setIsProcessing(true);
      setProgressValue(0);
      setProgressMessage('Loading PDF...');
      setPageResults([]);
      setProcessing('Converting PDF to DOCX...');

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

      const scale = scaleMap[quality];
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

      // Send to API for AI processing (one page at a time)
      const results: { pageNumber: number; content: string }[] = [];

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
          const response = await fetch('/api/pdf-to-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: [images[idx]],
              pageNumbers: [pageNums[idx]],
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
            content: `> **Error processing page ${pageNums[idx]}:** ${pageErr instanceof Error ? pageErr.message : 'Unknown error'}`,
          });
        }
      }

      setPageResults(results);
      setProgressValue(100);
      setProgressMessage('Conversion complete!');
      setProgress(100, 'Conversion complete!');

      // Create a downloadable DOC blob
      const combinedContent = results.map((p) => p.content).join('\n\n---\n\n');
      const htmlContent = markdownToHtml(combinedContent);
      const docHtml = createDocContent(
        htmlContent,
        files[0].name.replace('.pdf', '')
      );
      const docBlob = new Blob([docHtml], {
        type: 'application/msword',
      });

      const { setSuccess } = useFileStore.getState();
      setSuccess({
        blob: docBlob,
        filename: `${files[0].name.replace('.pdf', '')}.doc`,
        size: docBlob.size,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to convert PDF to DOCX'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = allContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadDocx = () => {
    const htmlContent = markdownToHtml(allContent);
    const docHtml = createDocContent(
      htmlContent,
      files.length > 0 ? files[0].name.replace('.pdf', '') : 'document'
    );
    const blob = new Blob([docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      files.length > 0
        ? `${files[0].name.replace('.pdf', '')}.doc`
        : 'converted.doc';
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

  const qualityOptions: {
    value: Quality;
    label: string;
    description: string;
    scaleLabel: string;
    icon: React.ElementType;
  }[] = [
    {
      value: 'standard',
      label: 'Standard',
      description: 'Faster processing, good quality',
      scaleLabel: '1x scale',
      icon: Zap,
    },
    {
      value: 'high',
      label: 'High',
      description: 'Better quality, slower processing',
      scaleLabel: '2x scale',
      icon: Gem,
    },
    {
      value: 'ultra',
      label: 'Ultra',
      description: 'Best quality, slowest processing',
      scaleLabel: '3x scale',
      icon: Crown,
    },
  ];

  return (
    <ToolPage
      toolId="pdf-to-docx"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleConvert}
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          disabled={files.length === 0 || isProcessing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Convert to DOCX
        </Button>
      }
    >
      {/* AI-Powered Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
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
            <Button
              onClick={handleDownloadDocx}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download as DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy Text
                </>
              )}
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Convert Another
            </Button>
          </div>

          {/* Scrollable preview area */}
          <ScrollArea className="max-h-[600px] rounded-lg border">
            <div className="p-4 space-y-6">
              {pageResults.map((page) => (
                <div key={page.pageNumber} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Page {page.pageNumber}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed">
                    {page.content}
                  </div>
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
              <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">AI-Powered PDF to DOCX Conversion</p>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF and our AI will extract and convert each page to a
                  Word-compatible document format, preserving headings, paragraphs,
                  lists, tables, and formatting.
                </p>
              </div>
            </div>
          </div>

          {/* Quality selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rendering Quality</label>
            <div className="grid grid-cols-3 gap-3">
              {qualityOptions.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setQuality(option.value)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      quality === option.value
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <OptionIcon
                        className={`h-4 w-4 ${
                          quality === option.value
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.scaleLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
