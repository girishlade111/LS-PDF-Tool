'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Copy, Download, Check, Type } from 'lucide-react';
import { getPdfjs } from '@/lib/pdf-worker';

export function PDFToTextTool() {
  const { files, setProcessing, setProgress, setSuccess, setError, resetProcessing } = useFileStore();
  const [extractedText, setExtractedText] = useState('');
  const [isExtracted, setIsExtracted] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;

  const handleExtract = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Extracting text...');
      setExtractedText('');
      setIsExtracted(false);

      const pdfjsLib = await getPdfjs();

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const numPages = pdf.numPages;
      const pageTexts: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 80), `Extracting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is { str: string } => 'str' in item)
          .map((item) => item.str)
          .join(' ');
        pageTexts.push(`--- Page ${i} ---\n${pageText}\n\n`);
      }

      const fullText = pageTexts.join('');
      setExtractedText(fullText);
      setIsExtracted(true);

      const blob = new Blob([fullText], { type: 'text/plain' });
      setSuccess({
        blob,
        filename: `${files[0].name.replace('.pdf', '')}.txt`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = extractedText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Clipboard unavailable — silently ignore
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    try {
      const blob = new Blob([extractedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = files.length > 0 && files[0] ? `${files[0].name.replace('.pdf', '')}.txt` : 'extracted-text.txt';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download text');
    }
  };

  return (
    <ToolPage
      toolId="pdf-to-text"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleExtract} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <FileText className="h-4 w-4 mr-2" />
          Extract Text
        </Button>
      }
    >
      {isExtracted ? (
        <div className="space-y-3">
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
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
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
          </div>

          {/* Scrollable text area */}
          <Textarea
            value={extractedText}
            readOnly
            className="min-h-[300px] max-h-[500px] font-mono text-sm resize-y"
          />
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Upload a PDF to extract its text content. The text from each page will be displayed and available for copying or downloading.
          </p>
        </div>
      )}
    </ToolPage>
  );
}
