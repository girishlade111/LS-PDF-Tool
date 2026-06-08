'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { loadPDF } from '@/lib/pdf-utils';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Type, ChevronDown, ChevronUp, AlignLeft, AlignCenter, AlignRight, Calendar, Hash, Info } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type FontSize = 8 | 10 | 12 | 14;
type PageNumberFormat = 'page-x' | 'page-x-of-y' | 'x-y' | 'dash-x';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

interface HeaderFooterConfig {
  leftText: string;
  centerText: string;
  rightText: string;
  fontSize: FontSize;
  colorPreset: string;
  includePageNumber: boolean;
  includeDate: boolean;
  pageNumberFormat: PageNumberFormat;
  dateFormat: DateFormat;
  margin: number;
}

// ─── Color Presets ──────────────────────────────────────────────────────────

const colorPresets = [
  { name: 'Black', r: 0, g: 0, b: 0, hex: '#000000' },
  { name: 'Dark Gray', r: 0.33, g: 0.33, b: 0.33, hex: '#545454' },
  { name: 'Gray', r: 0.5, g: 0.5, b: 0.5, hex: '#808080' },
  { name: 'Blue', r: 0.2, g: 0.4, b: 0.8, hex: '#3366CC' },
];

const defaultHeader: HeaderFooterConfig = {
  leftText: '',
  centerText: '',
  rightText: '',
  fontSize: 10,
  colorPreset: 'Dark Gray',
  includePageNumber: false,
  includeDate: false,
  pageNumberFormat: 'page-x',
  dateFormat: 'MM/DD/YYYY',
  margin: 36,
};

const defaultFooter: HeaderFooterConfig = {
  leftText: '',
  centerText: '',
  rightText: '',
  fontSize: 10,
  colorPreset: 'Dark Gray',
  includePageNumber: true,
  includeDate: false,
  pageNumberFormat: 'page-x',
  dateFormat: 'MM/DD/YYYY',
  margin: 36,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getColorByName(name: string) {
  return colorPresets.find((c) => c.name === name) || colorPresets[1];
}

function formatDate(format: DateFormat): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  if (format === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
  if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
  return `${y}-${m}-${d}`;
}

function formatPageNumber(format: PageNumberFormat, pageNum: number, totalPages: number): string {
  switch (format) {
    case 'page-x':
      return `Page ${pageNum}`;
    case 'page-x-of-y':
      return `Page ${pageNum} of ${totalPages}`;
    case 'x-y':
      return `${pageNum}/${totalPages}`;
    case 'dash-x':
      return `- ${pageNum} -`;
  }
}

function buildFinalText(
  config: HeaderFooterConfig,
  position: 'left' | 'center' | 'right',
  pageNum: number,
  totalPages: number
): string {
  const parts: string[] = [];
  const text = config[position === 'left' ? 'leftText' : position === 'center' ? 'centerText' : 'rightText'];
  if (text.trim()) parts.push(text.trim());

  if (position === 'center' && config.includePageNumber) {
    parts.push(formatPageNumber(config.pageNumberFormat, pageNum, totalPages));
  }
  if (position === 'right' && config.includeDate) {
    parts.push(formatDate(config.dateFormat));
  }

  return parts.join('  ');
}

function parsePageRange(input: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          indices.add(i - 1); // 0-based
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        indices.add(num - 1);
      }
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

// ─── Section Component ─────────────────────────────────────────────────────

function ConfigSection({
  title,
  icon: SectionIcon,
  config,
  onChange,
  isExpanded,
  onToggle,
  isFooter,
}: {
  title: string;
  icon: React.ElementType;
  config: HeaderFooterConfig;
  onChange: (updates: Partial<HeaderFooterConfig>) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isFooter: boolean;
}) {
  const currentColor = getColorByName(config.colorPreset);

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-all duration-200">
      {/* Section header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <SectionIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold">{title}</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.leftText || config.centerText || config.rightText
                ? 'Configured'
                : 'Not configured'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Section content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-5">
          <Separator />

          {/* Text positions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              Text Content
              <span className="text-xs text-muted-foreground font-normal">
                (fill one or more positions)
              </span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlignLeft className="h-3 w-3" />
                  Left
                </div>
                <Input
                  value={config.leftText}
                  onChange={(e) => onChange({ leftText: e.target.value })}
                  placeholder="Left text"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlignCenter className="h-3 w-3" />
                  Center
                </div>
                <Input
                  value={config.centerText}
                  onChange={(e) => onChange({ centerText: e.target.value })}
                  placeholder="Center text"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlignRight className="h-3 w-3" />
                  Right
                </div>
                <Input
                  value={config.rightText}
                  onChange={(e) => onChange({ rightText: e.target.value })}
                  placeholder="Right text"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Font size and color row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Size</Label>
              <div className="flex gap-1.5">
                {([8, 10, 12, 14] as FontSize[]).map((size) => (
                  <Button
                    key={size}
                    variant={config.fontSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onChange({ fontSize: size })}
                    className="flex-1 text-xs"
                  >
                    {size}pt
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Color</Label>
              <div className="flex gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onChange({ colorPreset: preset.name })}
                    className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                      config.colorPreset === preset.name
                        ? 'border-primary scale-110 shadow-md'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    title={preset.name}
                  >
                    <span
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Page number and date options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Auto-Insert Options</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={config.includePageNumber}
                  onChange={(e) => onChange({ includePageNumber: e.target.checked })}
                  className="h-4 w-4 rounded border-muted-foreground/50 text-primary accent-primary"
                />
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Page Number</div>
                    <div className="text-xs text-muted-foreground">In center position</div>
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeDate}
                  onChange={(e) => onChange({ includeDate: e.target.checked })}
                  className="h-4 w-4 rounded border-muted-foreground/50 text-primary accent-primary"
                />
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Date</div>
                    <div className="text-xs text-muted-foreground">In right position</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Page number format (if includePageNumber) */}
          {config.includePageNumber && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Page Number Format</Label>
              <Select
                value={config.pageNumberFormat}
                onValueChange={(v) => onChange({ pageNumberFormat: v as PageNumberFormat })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page-x">Page X</SelectItem>
                  <SelectItem value="page-x-of-y">Page X of Y</SelectItem>
                  <SelectItem value="x-y">X/Y</SelectItem>
                  <SelectItem value="dash-x">- X -</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date format (if includeDate) */}
          {config.includeDate && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Format</Label>
              <Select
                value={config.dateFormat}
                onValueChange={(v) => onChange({ dateFormat: v as DateFormat })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Margin control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isFooter ? 'Bottom Margin' : 'Top Margin'}: {config.margin}pt
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={18}
                max={72}
                step={6}
                value={config.margin}
                onChange={(e) => onChange({ margin: parseInt(e.target.value, 10) })}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-xs text-muted-foreground w-14 text-right">{config.margin}pt</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Component ─────────────────────────────────────────────────────

function LivePreview({ header, footer }: { header: HeaderFooterConfig; footer: HeaderFooterConfig }) {
  const hasHeader = header.leftText || header.centerText || header.rightText || header.includePageNumber || header.includeDate;
  const hasFooter = footer.leftText || footer.centerText || footer.rightText || footer.includePageNumber || footer.includeDate;

  // Sample page dimensions for preview (scaled down)
  const previewWidth = 200;
  const previewHeight = 260;
  const marginPx = 12;

  const headerColor = getColorByName(header.colorPreset);
  const footerColor = getColorByName(footer.colorPreset);

  // Build preview text for each position
  const headerLeft = buildFinalText(header, 'left', 1, 5);
  const headerCenter = buildFinalText(header, 'center', 1, 5);
  const headerRight = buildFinalText(header, 'right', 1, 5);

  const footerLeft = buildFinalText(footer, 'left', 1, 5);
  const footerCenter = buildFinalText(footer, 'center', 1, 5);
  const footerRight = buildFinalText(footer, 'right', 1, 5);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
        Preview
      </Label>
      <div className="flex justify-center">
        <div
          className="relative bg-white dark:bg-zinc-900 border border-border shadow-sm rounded-sm overflow-hidden"
          style={{ width: previewWidth, height: previewHeight }}
        >
          {/* Header area */}
          {hasHeader && (
            <div
              className="absolute left-0 right-0 flex items-start justify-between px-2 border-b border-dashed border-amber-300/50 dark:border-amber-700/30"
              style={{
                top: 0,
                height: marginPx + 12,
                paddingTop: Math.max(4, (header.margin / 72) * 8),
              }}
            >
              <span
                className="truncate max-w-[60px] text-left"
                style={{ fontSize: Math.min(header.fontSize * 0.7, 10), color: headerColor.hex }}
              >
                {headerLeft}
              </span>
              <span
                className="truncate max-w-[60px] text-center"
                style={{ fontSize: Math.min(header.fontSize * 0.7, 10), color: headerColor.hex }}
              >
                {headerCenter}
              </span>
              <span
                className="truncate max-w-[60px] text-right"
                style={{ fontSize: Math.min(header.fontSize * 0.7, 10), color: headerColor.hex }}
              >
                {headerRight}
              </span>
            </div>
          )}

          {/* Page content placeholder */}
          <div className="absolute inset-x-3 top-1/3 bottom-1/3 flex items-center justify-center">
            <div className="space-y-1.5 w-full">
              <div className="h-1.5 bg-muted/40 rounded w-full" />
              <div className="h-1.5 bg-muted/40 rounded w-4/5" />
              <div className="h-1.5 bg-muted/40 rounded w-full" />
              <div className="h-1.5 bg-muted/40 rounded w-3/5" />
            </div>
          </div>

          {/* Footer area */}
          {hasFooter && (
            <div
              className="absolute left-0 right-0 flex items-end justify-between px-2 border-t border-dashed border-amber-300/50 dark:border-amber-700/30"
              style={{
                bottom: 0,
                height: marginPx + 12,
                paddingBottom: Math.max(4, (footer.margin / 72) * 8),
              }}
            >
              <span
                className="truncate max-w-[60px] text-left"
                style={{ fontSize: Math.min(footer.fontSize * 0.7, 10), color: footerColor.hex }}
              >
                {footerLeft}
              </span>
              <span
                className="truncate max-w-[60px] text-center"
                style={{ fontSize: Math.min(footer.fontSize * 0.7, 10), color: footerColor.hex }}
              >
                {footerCenter}
              </span>
              <span
                className="truncate max-w-[60px] text-right"
                style={{ fontSize: Math.min(footer.fontSize * 0.7, 10), color: footerColor.hex }}
              >
                {footerRight}
              </span>
            </div>
          )}

          {/* No content message */}
          {!hasHeader && !hasFooter && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground/50 italic">No header or footer</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Approximate layout preview
      </p>
    </div>
  );
}

// ─── Main Tool Component ───────────────────────────────────────────────────

export function HeaderFooterTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [headerConfig, setHeaderConfig] = useState<HeaderFooterConfig>(defaultHeader);
  const [footerConfig, setFooterConfig] = useState<HeaderFooterConfig>(defaultFooter);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [footerExpanded, setFooterExpanded] = useState(true);
  const [applyTo, setApplyTo] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('');

  const hasHeaderContent = headerConfig.leftText || headerConfig.centerText || headerConfig.rightText || headerConfig.includePageNumber || headerConfig.includeDate;
  const hasFooterContent = footerConfig.leftText || footerConfig.centerText || footerConfig.rightText || footerConfig.includePageNumber || footerConfig.includeDate;
  const canProcess = files.length > 0 && (hasHeaderContent || hasFooterContent);

  const handleApply = async () => {
    if (files.length === 0 || (!hasHeaderContent && !hasFooterContent)) return;

    try {
      setProcessing('Adding headers and footers...');
      setProgress(10, 'Reading document...');

      const pdf: PDFDocument = await loadPDF(files[0].data);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const totalPages = pages.length;

      // Determine which pages to apply to
      let targetIndices: number[];
      if (applyTo === 'range' && pageRange.trim()) {
        targetIndices = parsePageRange(pageRange, totalPages);
        if (targetIndices.length === 0) {
          setError('Invalid page range. Use format like "1,3,5-8".');
          return;
        }
      } else {
        targetIndices = pages.map((_, i) => i);
      }

      setProgress(30, 'Adding headers and footers...');

      for (let idx = 0; idx < targetIndices.length; idx++) {
        const pageIndex = targetIndices[idx];
        const page = pages[pageIndex];
        const { width } = page.getSize();
        const pageNum = pageIndex + 1;
        const progressPct = 30 + Math.round((idx / targetIndices.length) * 50);
        setProgress(progressPct, `Processing page ${pageNum} of ${totalPages}...`);

        // Draw header
        if (hasHeaderContent) {
          const headerColor = getColorByName(headerConfig.colorPreset);
          const headerY = page.getSize().height - headerConfig.margin;

          // Left
          const hLeftText = buildFinalText(headerConfig, 'left', pageNum, totalPages);
          if (hLeftText) {
            const textWidth = font.widthOfTextAtSize(hLeftText, headerConfig.fontSize);
            const x = Math.max(36, 36); // left margin
            page.drawText(hLeftText, {
              x,
              y: headerY - headerConfig.fontSize,
              size: headerConfig.fontSize,
              font,
              color: rgb(headerColor.r, headerColor.g, headerColor.b),
            });
          }

          // Center
          const hCenterText = buildFinalText(headerConfig, 'center', pageNum, totalPages);
          if (hCenterText) {
            const textWidth = font.widthOfTextAtSize(hCenterText, headerConfig.fontSize);
            const x = (width - textWidth) / 2;
            page.drawText(hCenterText, {
              x,
              y: headerY - headerConfig.fontSize,
              size: headerConfig.fontSize,
              font,
              color: rgb(headerColor.r, headerColor.g, headerColor.b),
            });
          }

          // Right
          const hRightText = buildFinalText(headerConfig, 'right', pageNum, totalPages);
          if (hRightText) {
            const textWidth = font.widthOfTextAtSize(hRightText, headerConfig.fontSize);
            const x = width - textWidth - 36;
            page.drawText(hRightText, {
              x,
              y: headerY - headerConfig.fontSize,
              size: headerConfig.fontSize,
              font,
              color: rgb(headerColor.r, headerColor.g, headerColor.b),
            });
          }
        }

        // Draw footer
        if (hasFooterContent) {
          const footerColor = getColorByName(footerConfig.colorPreset);

          // Left
          const fLeftText = buildFinalText(footerConfig, 'left', pageNum, totalPages);
          if (fLeftText) {
            const x = Math.max(36, 36);
            page.drawText(fLeftText, {
              x,
              y: footerConfig.margin,
              size: footerConfig.fontSize,
              font,
              color: rgb(footerColor.r, footerColor.g, footerColor.b),
            });
          }

          // Center
          const fCenterText = buildFinalText(footerConfig, 'center', pageNum, totalPages);
          if (fCenterText) {
            const textWidth = font.widthOfTextAtSize(fCenterText, footerConfig.fontSize);
            const x = (width - textWidth) / 2;
            page.drawText(fCenterText, {
              x,
              y: footerConfig.margin,
              size: footerConfig.fontSize,
              font,
              color: rgb(footerColor.r, footerColor.g, footerColor.b),
            });
          }

          // Right
          const fRightText = buildFinalText(footerConfig, 'right', pageNum, totalPages);
          if (fRightText) {
            const textWidth = font.widthOfTextAtSize(fRightText, footerConfig.fontSize);
            const x = width - textWidth - 36;
            page.drawText(fRightText, {
              x,
              y: footerConfig.margin,
              size: footerConfig.fontSize,
              font,
              color: rgb(footerColor.r, footerColor.g, footerColor.b),
            });
          }
        }
      }

      setProgress(85, 'Saving document...');
      const result = await pdf.save();
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `header-footer-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add headers and footers');
    }
  };

  return (
    <ToolPage
      toolId="header-footer"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleApply}
          size="lg"
          className="w-full sm:w-auto"
          disabled={!canProcess}
        >
          <Type className="h-4 w-4 mr-2" />
          Apply Header & Footer
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Header config section */}
        <ConfigSection
          title="Header"
          icon={Type}
          config={headerConfig}
          onChange={(updates) => setHeaderConfig((prev) => ({ ...prev, ...updates }))}
          isExpanded={headerExpanded}
          onToggle={() => setHeaderExpanded(!headerExpanded)}
          isFooter={false}
        />

        {/* Footer config section */}
        <ConfigSection
          title="Footer"
          icon={Type}
          config={footerConfig}
          onChange={(updates) => setFooterConfig((prev) => ({ ...prev, ...updates }))}
          isExpanded={footerExpanded}
          onToggle={() => setFooterExpanded(!footerExpanded)}
          isFooter={true}
        />

        {/* Apply to pages */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <Label className="text-sm font-medium">Apply to Pages</Label>
          <div className="flex gap-2">
            <Button
              variant={applyTo === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setApplyTo('all')}
              className="flex-1"
            >
              All Pages
            </Button>
            <Button
              variant={applyTo === 'range' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setApplyTo('range')}
              className="flex-1"
            >
              Page Range
            </Button>
          </div>
          {applyTo === 'range' && (
            <div className="space-y-1.5">
              <Input
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1,3,5-8"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter page numbers separated by commas. Use dashes for ranges (e.g., 1,3,5-8).
              </p>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="rounded-xl border bg-card p-5">
          <LivePreview header={headerConfig} footer={footerConfig} />
        </div>
      </div>
    </ToolPage>
  );
}
