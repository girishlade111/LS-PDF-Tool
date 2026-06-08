'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Copy, Download } from 'lucide-react';

export function PDFToTextTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [extractedText, setExtractedText] = useState('');
  const [isExtracted, setIsExtracted] = useState(false);

  const handleExtract = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Extracting text...');

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const pdf = await pdfjsLib.getDocument({ data: files[0].data }).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 80), `Extracting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

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

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
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
      {isExtracted && extractedText && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Text
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download .txt
            </Button>
          </div>
          <Textarea
            value={extractedText}
            readOnly
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      )}
      {!isExtracted && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Upload a PDF to extract its text content. The text from each page will be displayed and available for download.
          </p>
        </div>
      )}
    </ToolPage>
  );
}
