'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { redactPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Eraser, Info, AlertTriangle, Type, Palette, PenTool } from 'lucide-react';

type RedactionColor = 'black' | 'dark-gray' | 'white';
type RedactionStyle = 'solid' | 'x-mark';

const colorPresets: Record<RedactionColor, { label: string; value: { r: number; g: number; b: number }; css: string; border: string }> = {
  black: { label: 'Black', value: { r: 0, g: 0, b: 0 }, css: 'bg-black', border: 'border-gray-400' },
  'dark-gray': { label: 'Dark Gray', value: { r: 0.25, g: 0.25, b: 0.25 }, css: 'bg-gray-700', border: 'border-gray-500' },
  white: { label: 'White', value: { r: 1, g: 1, b: 1 }, css: 'bg-white', border: 'border-gray-300' },
};

const styleOptions: Record<RedactionStyle, { label: string; description: string }> = {
  solid: { label: 'Solid Fill', description: 'Draw a filled rectangle over the text' },
  'x-mark': { label: 'X Mark', description: 'Draw a filled rectangle with X marks' },
};

export function RedactPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [searchText, setSearchText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [redactionColor, setRedactionColor] = useState<RedactionColor>('black');
  const [redactionStyle, setRedactionStyle] = useState<RedactionStyle>('solid');

  const handleRedact = async () => {
    if (files.length === 0) return;
    if (!searchText.trim()) {
      setError('Please enter text to redact.');
      return;
    }
    try {
      setProcessing('Redacting PDF...');
      setProgress(20, 'Analyzing document text...');

      const result = await redactPDF(files[0].data, searchText, {
        caseSensitive,
        wholeWord,
        color: colorPresets[redactionColor].value,
        style: redactionStyle,
      });

      setProgress(90, 'Creating redacted file...');

      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `redacted-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redact PDF');
    }
  };

  return (
    <ToolPage
      toolId="redact"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleRedact}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || !searchText.trim()}
        >
          <Eraser className="h-4 w-4 mr-2" />
          Redact PDF
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Warning card */}
        <Card className="border-rose-200 dark:border-rose-800/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Redaction is visual — it draws colored rectangles over matching text areas. The underlying text data may still be present in the file.
                </p>
                <p>
                  For true redaction, the text would need to be removed from the document&apos;s content stream, which requires more advanced processing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Enter the text you want to redact. The tool will find all occurrences and cover them with colored rectangles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text to redact */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Type className="h-4 w-4 text-rose-500" />
            Text to Redact
          </h3>

          <div className="space-y-2">
            <Label>Search Text</Label>
            <Input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter text to redact..."
            />
            <p className="text-xs text-muted-foreground">
              All occurrences of this text will be covered with redaction marks.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked === true)}
              />
              <Label htmlFor="case-sensitive" className="cursor-pointer text-sm">
                Case sensitive
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(checked === true)}
              />
              <Label htmlFor="whole-word" className="cursor-pointer text-sm">
                Whole word only
              </Label>
            </div>
          </div>
        </div>

        {/* Redaction color */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-rose-500" />
            Redaction Color
          </h3>

          <div className="flex items-center gap-3">
            {(Object.keys(colorPresets) as RedactionColor[]).map((colorKey) => {
              const preset = colorPresets[colorKey];
              return (
                <button
                  key={colorKey}
                  onClick={() => setRedactionColor(colorKey)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all duration-200 ${
                    redactionColor === colorKey
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                      : 'border-muted hover:border-rose-300 dark:hover:border-rose-700'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full ${preset.css} border ${preset.border}`} />
                  <span className={`text-xs font-medium ${redactionColor === colorKey ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Redaction style */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <PenTool className="h-4 w-4 text-rose-500" />
            Redaction Style
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(styleOptions) as RedactionStyle[]).map((styleKey) => {
              const styleOpt = styleOptions[styleKey];
              return (
                <button
                  key={styleKey}
                  onClick={() => setRedactionStyle(styleKey)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                    redactionStyle === styleKey
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                      : 'border-muted hover:border-rose-300 dark:hover:border-rose-700'
                  }`}
                >
                  {/* Visual preview of style */}
                  <div className="w-16 h-8 relative">
                    <div className={`absolute inset-0 ${colorPresets[redactionColor].css} rounded-sm ${colorPresets[redactionColor].css === 'bg-white' ? 'border border-gray-300' : ''}`} />
                    {styleKey === 'x-mark' && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-10 h-0.5 ${colorPresets[redactionColor].css === 'bg-white' ? 'bg-gray-400' : 'bg-white/70'} rotate-45`} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-10 h-0.5 ${colorPresets[redactionColor].css === 'bg-white' ? 'bg-gray-400' : 'bg-white/70'} -rotate-45`} />
                        </div>
                      </>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${redactionStyle === styleKey ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {styleOpt.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {styleOpt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
