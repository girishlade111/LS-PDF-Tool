'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { pdfToHTML } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Code, Copy, Check, Download, FileText, Info } from 'lucide-react';
import JSZip from 'jszip';

type ConversionMode = 'simple' | 'structured';

export function PDFToHTMLTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [mode, setMode] = useState<ConversionMode>('simple');
  const [includeImages, setIncludeImages] = useState(false);
  const [pageRangeInput, setPageRangeInput] = useState('all');
  const [htmlResult, setHtmlResult] = useState<string>('');
  const [pagesResult, setPagesResult] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);

  const parsePageRange = (input: string, totalPages: number): number[] => {
    if (input.trim().toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const parts = input.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages && !pages.includes(num)) {
          pages.push(num);
        }
      }
    }
    return pages.sort((a, b) => a - b);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setConverting(true);
      setProcessing('Converting PDF to HTML...');
      setProgress(20, 'Extracting text content...');

      const totalPages = files[0].pageCount || 1;
      const pageRange = parsePageRange(pageRangeInput, totalPages);

      if (pageRange.length === 0) {
        setError('Invalid page range. Please enter a valid range like "1,3,5-8" or "all".');
        setConverting(false);
        return;
      }

      setProgress(40, 'Converting pages...');

      const result = await pdfToHTML(files[0].data, {
        mode,
        includeImages,
        pageRange,
      });

      setProgress(80, 'Conversion complete');
      setHtmlResult(result.html);
      setPagesResult(result.pages);

      setProgress(100, 'Done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert PDF to HTML');
    } finally {
      setConverting(false);
    }
  };

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(htmlResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = htmlResult;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadHTML = () => {
    const baseName = files[0].name.replace(/\.pdf$/i, '');
    const blob = new Blob([htmlResult], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${baseName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZIP = async () => {
    if (pagesResult.length === 0) return;
    const zip = new JSZip();
    const baseName = files[0].name.replace(/\.pdf$/i, '');

    pagesResult.forEach((pageHtml, index) => {
      const fullPageHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Page ${index + 1}</title><style>body{margin:0;padding:20px;font-family:sans-serif;}.page{max-width:800px;margin:0 auto;padding:20px;border:1px solid #ccc;}</style></head><body>${pageHtml}</body></html>`;
      zip.file(`page-${index + 1}.html`, fullPageHtml);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${baseName}-pages.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPage
      toolId="pdf-to-html"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleConvert}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || converting}
        >
          <Code className="h-4 w-4 mr-2" />
          Convert to HTML
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Info card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Convert your PDF to HTML format. Choose between simple text extraction or a structured layout that preserves approximate positioning.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion options */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Code className="h-4 w-4 text-amber-500" />
            Conversion Options
          </h3>

          {/* Mode selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Conversion Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('simple')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 ${
                  mode === 'simple'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-400'
                    : 'border-muted hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                <FileText className={`h-5 w-5 ${mode === 'simple' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${mode === 'simple' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Simple
                </span>
                <span className="text-xs text-muted-foreground text-center">Extract text as paragraphs</span>
              </button>

              <button
                onClick={() => setMode('structured')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 ${
                  mode === 'structured'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-400'
                    : 'border-muted hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                <Code className={`h-5 w-5 ${mode === 'structured' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${mode === 'structured' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Structured
                </span>
                <span className="text-xs text-muted-foreground text-center">Preserve approximate layout</span>
              </button>
            </div>
          </div>

          {/* Include images toggle */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="include-images"
              checked={includeImages}
              onCheckedChange={(checked) => setIncludeImages(checked === true)}
            />
            <Label htmlFor="include-images" className="cursor-pointer text-sm">
              Include images in output
            </Label>
          </div>

          {/* Page range */}
          <div className="space-y-2">
            <Label htmlFor="page-range" className="text-sm font-medium">Page Range</Label>
            <Input
              id="page-range"
              value={pageRangeInput}
              onChange={(e) => setPageRangeInput(e.target.value)}
              placeholder="e.g., 1,3,5-8 or all"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter page numbers separated by commas, or ranges with dashes. Use &quot;all&quot; for all pages.
            </p>
          </div>
        </div>

        {/* HTML Preview */}
        {htmlResult && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Code className="h-4 w-4 text-amber-500" />
                  HTML Preview
                </h3>
                <Badge variant="secondary">
                  {pagesResult.length} page{pagesResult.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Scrollable code preview */}
              <div className="relative rounded-lg border bg-muted/30 overflow-hidden">
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
                  <code>{htmlResult}</code>
                </pre>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyHTML}
                  className="w-full sm:w-auto"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy HTML
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadHTML}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download as HTML
                </Button>
                {pagesResult.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadZIP}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download as ZIP
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Converting state */}
        {converting && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600 dark:border-amber-800 dark:border-t-amber-400" />
                <p className="text-sm text-muted-foreground">Converting PDF to HTML...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolPage>
  );
}
