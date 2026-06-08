'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { loadPDF } from '@/lib/pdf-utils';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Hash, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export function PageNumbersTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('center');
  const [startFrom, setStartFrom] = useState(1);
  const [format, setFormat] = useState<'numeric' | 'roman' | 'dash'>('numeric');

  const handleAddNumbers = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Adding page numbers...');
      setProgress(20, 'Reading document...');
      
      const pdf = await loadPDF(files[0].data);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      
      setProgress(50, 'Adding page numbers...');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width } = page.getSize();
        const pageNum = i + startFrom;
        
        let text: string;
        if (format === 'numeric') {
          text = `${pageNum}`;
        } else if (format === 'roman') {
          text = toRoman(pageNum);
        } else {
          text = `- ${pageNum} -`;
        }
        
        const textWidth = font.widthOfTextAtSize(text, 10);
        let x: number;
        
        if (position === 'left') {
          x = 40;
        } else if (position === 'right') {
          x = width - textWidth - 40;
        } else {
          x = (width - textWidth) / 2;
        }
        
        page.drawText(text, {
          x,
          y: 30,
          size: 10,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
      
      setProgress(80, 'Saving document...');
      const result = await pdf.save();
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `numbered-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add page numbers');
    }
  };

  return (
    <ToolPage
      toolId="page-numbers"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleAddNumbers} size="lg" className="w-full sm:w-auto" disabled={files.length === 0}>
          <Hash className="h-4 w-4 mr-2" />
          Add Page Numbers
        </Button>
      }
    >
      <div className="space-y-5 rounded-2xl border bg-card p-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Position</Label>
          <div className="flex gap-2">
            {([
              { value: 'left' as const, icon: AlignLeft, label: 'Left' },
              { value: 'center' as const, icon: AlignCenter, label: 'Center' },
              { value: 'right' as const, icon: AlignRight, label: 'Right' },
            ]).map((pos) => (
              <Button
                key={pos.value}
                variant={position === pos.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPosition(pos.value)}
                className="flex-1"
              >
                <pos.icon className="h-3.5 w-3.5 mr-1.5" />
                {pos.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="numeric">1, 2, 3...</SelectItem>
              <SelectItem value="roman">I, II, III...</SelectItem>
              <SelectItem value="dash">- 1 -, - 2 -...</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startFrom" className="text-sm font-medium">Start from page number</Label>
          <Input
            id="startFrom"
            type="number"
            min={1}
            value={startFrom}
            onChange={(e) => setStartFrom(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full"
          />
        </div>
      </div>
    </ToolPage>
  );
}

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}
