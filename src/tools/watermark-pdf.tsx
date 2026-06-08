'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { watermarkPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Droplets, MoveDiagonal, AlignCenter, ArrowUp, ArrowDown } from 'lucide-react';

type WatermarkPosition = 'diagonal' | 'center' | 'top' | 'bottom';

const colorPresets = [
  { name: 'Gray', r: 0.5, g: 0.5, b: 0.5, hex: '#808080' },
  { name: 'Red', r: 0.8, g: 0.2, b: 0.2, hex: '#CC3333' },
  { name: 'Blue', r: 0.2, g: 0.4, b: 0.8, hex: '#3366CC' },
  { name: 'Black', r: 0.1, g: 0.1, b: 0.1, hex: '#1A1A1A' },
];

const positionOptions: {
  value: WatermarkPosition;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'diagonal', label: 'Diagonal', icon: MoveDiagonal },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'top', label: 'Top', icon: ArrowUp },
  { value: 'bottom', label: 'Bottom', icon: ArrowDown },
];

const rotationOptions = [
  { value: -45, label: '45°' },
  { value: 0, label: '0°' },
  { value: -90, label: '90°' },
];

export function WatermarkPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(30);
  const [color, setColor] = useState(colorPresets[0]);
  const [position, setPosition] = useState<WatermarkPosition>('diagonal');
  const [rotation, setRotation] = useState(-45);

  const handleWatermark = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Adding watermark...');
      setProgress(30, 'Reading document...');
      const result = await watermarkPDF(files[0].data, watermarkText, {
        fontSize,
        opacity: opacity / 100,
        color: { r: color.r, g: color.g, b: color.b },
        position,
        rotation,
      });
      setProgress(80, 'Applying watermark...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `watermarked-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add watermark');
    }
  };

  return (
    <ToolPage
      toolId="watermark"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button onClick={handleWatermark} size="lg" className="w-full sm:w-auto" disabled={files.length === 0 || !watermarkText.trim()}>
          <Droplets className="h-4 w-4 mr-2" />
          Add Watermark
        </Button>
      }
    >
      <div className="space-y-5 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Label>Watermark Text</Label>
          <Input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter watermark text"
          />
        </div>
        <div className="space-y-2">
          <Label>Font Size: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={20}
            max={120}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Opacity: {opacity}%</Label>
          <Slider
            value={[opacity]}
            onValueChange={([v]) => setOpacity(v)}
            min={5}
            max={80}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Color</Label>
          <div className="flex gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setColor(preset)}
                className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                  color.name === preset.name
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">Position</Label>
          <div className="grid grid-cols-4 gap-2">
            {positionOptions.map((pos) => (
              <Button
                key={pos.value}
                variant={position === pos.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPosition(pos.value)}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <pos.icon className="h-3.5 w-3.5" />
                <span className="text-xs">{pos.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Rotation Angle</Label>
          <div className="flex gap-2">
            {rotationOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={rotation === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRotation(opt.value)}
                className="flex-1"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        {/* Visual preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="relative w-full h-32 rounded-lg border bg-muted/20 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-sans font-bold select-none truncate max-w-[90%]"
                style={{
                  fontSize: `${Math.min(fontSize / 4, 28)}px`,
                  color: color.hex,
                  opacity: opacity / 100,
                  transform:
                    position === 'diagonal'
                      ? `rotate(${rotation}deg)`
                      : position === 'top'
                        ? 'translateY(-60%)'
                        : position === 'bottom'
                          ? 'translateY(60%)'
                          : 'none',
                }}
              >
                {watermarkText || 'WATERMARK'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
