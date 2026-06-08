'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { signPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PenTool, Eraser, Type, Upload, Info, AlertTriangle } from 'lucide-react';

type SignatureType = 'draw' | 'type' | 'upload';
type PenColor = 'black' | 'blue' | 'red';
type PenThickness = 'thin' | 'medium' | 'thick';
type Position = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right';
type SignatureScale = 'small' | 'medium' | 'large';

const FONT_STYLES: Record<number, { name: string; style: React.CSSProperties }> = {
  1: { name: 'Classic', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic' } },
  2: { name: 'Elegant', style: { fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontWeight: 'bold' } },
  3: { name: 'Modern', style: { fontFamily: '"Courier New", monospace' } },
  4: { name: 'Script', style: { fontFamily: 'cursive', fontStyle: 'italic' } },
};

export function SignPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [signatureType, setSignatureType] = useState<SignatureType>('draw');

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<PenColor>('black');
  const [penThickness, setPenThickness] = useState<PenThickness>('medium');
  const [hasDrawn, setHasDrawn] = useState(false);

  // Type state
  const [signerName, setSignerName] = useState('');
  const [fontStyle, setFontStyle] = useState(1);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageBytes, setUploadedImageBytes] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Placement state
  const [pageNumber, setPageNumber] = useState(1);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [signatureScale, setSignatureScale] = useState<SignatureScale>('medium');

  const totalPages = files.length > 0 && files[0].pageCount ? files[0].pageCount : 1;

  // Canvas drawing setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [signatureType]);

  const getPenColorHex = useCallback((color: PenColor): string => {
    switch (color) {
      case 'black': return '#000000';
      case 'blue': return '#1e40af';
      case 'red': return '#dc2626';
    }
  }, []);

  const getPenWidth = useCallback((thickness: PenThickness): number => {
    switch (thickness) {
      case 'thin': return 2;
      case 'medium': return 4;
      case 'thick': return 6;
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = getPenColorHex(penColor);
    ctx.lineWidth = getPenWidth(penThickness);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [penColor, penThickness, getPenColorHex, getPenWidth]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const arrayReader = new FileReader();
    arrayReader.onload = () => {
      setUploadedImageBytes(new Uint8Array(arrayReader.result as ArrayBuffer));
    };
    arrayReader.readAsArrayBuffer(file);
  }, []);

  const getSignatureImage = useCallback(async (): Promise<Uint8Array | null> => {
    if (signatureType === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return null;
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(null); return; }
          const reader = new FileReader();
          reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      });
    } else if (signatureType === 'type') {
      if (!signerName.trim()) return null;
      // Render typed signature to canvas
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const style = FONT_STYLES[fontStyle];
      ctx.fillStyle = '#000000';
      ctx.font = `${style.style.fontWeight || 'normal'} ${style.style.fontStyle || 'normal'} 48px ${style.style.fontFamily || 'serif'}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(signerName, canvas.width / 2, canvas.height / 2);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(null); return; }
          const reader = new FileReader();
          reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      });
    } else {
      return uploadedImageBytes;
    }
  }, [signatureType, hasDrawn, signerName, fontStyle, uploadedImageBytes]);

  const canSign = () => {
    if (files.length === 0) return false;
    if (signatureType === 'draw') return hasDrawn;
    if (signatureType === 'type') return signerName.trim().length > 0;
    if (signatureType === 'upload') return uploadedImageBytes !== null;
    return false;
  };

  const handleSign = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Adding signature to PDF...');
      setProgress(20, 'Preparing signature...');

      const signatureImage = await getSignatureImage();
      if (!signatureImage) {
        setError('No signature provided. Please draw, type, or upload a signature.');
        return;
      }

      setProgress(50, 'Signing document...');

      const result = await signPDF(files[0].data, signatureImage, {
        page: pageNumber,
        position,
        scale: signatureScale,
      });

      setProgress(90, 'Creating signed file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `signed-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign PDF');
    }
  };

  const positionLabels: Record<Position, string> = {
    'bottom-right': 'Bottom Right',
    'bottom-left': 'Bottom Left',
    'bottom-center': 'Bottom Center',
    'top-right': 'Top Right',
  };

  return (
    <ToolPage
      toolId="sign"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleSign}
          size="lg"
          className="w-full sm:w-auto"
          disabled={!canSign()}
        >
          <PenTool className="h-4 w-4 mr-2" />
          Sign PDF
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Warning card about visual signature */}
        <Card className="border-amber-200 dark:border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  This tool adds a <strong>visual signature image</strong> to your PDF. It is not a cryptographic/digital signature.
                </p>
                <p>
                  The signature will appear as an image placed at the specified position on the selected page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature type selector */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <PenTool className="h-4 w-4 text-purple-500" />
            Signature Type
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSignatureType('draw')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 ${
                signatureType === 'draw'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400'
                  : 'border-muted hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <PenTool className={`h-4 w-4 ${signatureType === 'draw' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-medium ${signatureType === 'draw' ? 'text-foreground' : 'text-muted-foreground'}`}>Draw</span>
            </button>
            <button
              onClick={() => setSignatureType('type')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 ${
                signatureType === 'type'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400'
                  : 'border-muted hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Type className={`h-4 w-4 ${signatureType === 'type' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-medium ${signatureType === 'type' ? 'text-foreground' : 'text-muted-foreground'}`}>Type</span>
            </button>
            <button
              onClick={() => setSignatureType('upload')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 ${
                signatureType === 'upload'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400'
                  : 'border-muted hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Upload className={`h-4 w-4 ${signatureType === 'upload' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-medium ${signatureType === 'upload' ? 'text-foreground' : 'text-muted-foreground'}`}>Upload</span>
            </button>
          </div>

          {/* Draw tab */}
          {signatureType === 'draw' && (
            <div className="space-y-3">
              {/* Canvas */}
              <div className="border-2 border-dashed rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full touch-none cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              {/* Pen color selector */}
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground">Color:</Label>
                <div className="flex items-center gap-2">
                  {(['black', 'blue', 'red'] as PenColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setPenColor(color)}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${
                        penColor === color
                          ? 'border-purple-500 scale-110 shadow-sm'
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                      style={{ backgroundColor: getPenColorHex(color) }}
                      aria-label={`${color} pen color`}
                    />
                  ))}
                </div>
              </div>

              {/* Pen thickness */}
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground">Thickness:</Label>
                <div className="flex items-center gap-2">
                  {(['thin', 'medium', 'thick'] as PenThickness[]).map((thickness) => (
                    <button
                      key={thickness}
                      onClick={() => setPenThickness(thickness)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        penThickness === thickness
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                      }`}
                    >
                      {thickness.charAt(0).toUpperCase() + thickness.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="w-full sm:w-auto"
              >
                <Eraser className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          )}

          {/* Type tab */}
          {signatureType === 'type' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="signer-name" className="text-sm font-medium">Signer Name</Label>
                <Input
                  id="signer-name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your name"
                  className="text-sm"
                />
              </div>

              {/* Font selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FONT_STYLES).map(([id, font]) => (
                    <button
                      key={id}
                      onClick={() => setFontStyle(Number(id))}
                      className={`rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                        fontStyle === Number(id)
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400'
                          : 'border-muted hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      <span className="text-xs text-muted-foreground block">{font.name}</span>
                      <span className="text-lg" style={font.style}>
                        {signerName || 'Signature'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {signerName.trim() && (
                <div className="rounded-lg border bg-white p-4 text-center">
                  <span
                    className="text-2xl text-black"
                    style={FONT_STYLES[fontStyle].style}
                  >
                    {signerName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upload tab */}
          {signatureType === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Signature Image
              </Button>
              <p className="text-xs text-muted-foreground">Supports PNG and JPG formats</p>

              {uploadedImage && (
                <div className="rounded-lg border bg-white p-4 flex items-center justify-center">
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Placement controls */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-purple-500" />
            Signature Placement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Page number */}
            <div className="space-y-2">
              <Label htmlFor="page-number" className="text-sm font-medium">Page</Label>
              <Input
                id="page-number"
                type="number"
                min={1}
                max={totalPages}
                value={pageNumber}
                onChange={(e) => setPageNumber(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
                className="text-sm"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Position</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['bottom-right', 'bottom-left', 'bottom-center', 'top-right'] as Position[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                      position === pos
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                    }`}
                  >
                    {positionLabels[pos]}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Size</Label>
              <div className="flex items-center gap-1.5">
                {(['small', 'medium', 'large'] as SignatureScale[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSignatureScale(s)}
                    className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                      signatureScale === s
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
