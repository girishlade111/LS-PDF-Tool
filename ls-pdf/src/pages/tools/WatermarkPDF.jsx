import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Stamp, File as FileIcon, X, AlertCircle } from 'lucide-react';
import { pdfjsLib } from '../../utils/pdfUtils';
import ToolPageLayout from '../../components/common/ToolPageLayout';
import FileDropzone from '../../components/common/FileDropzone';
import ProcessingStatus from '../../components/common/ProcessingStatus';
import DownloadResult from '../../components/common/DownloadResult';
import { useFileStore } from '../../context/FileStoreContext';
import { addHistoryEntry } from '../../utils/indexedDBUtils';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const COLORS = [
  { id: 'gray', label: 'Gray', hex: '#808080', rgb: [0.5, 0.5, 0.5] },
  { id: 'red', label: 'Red', hex: '#EF4444', rgb: [0.937, 0.266, 0.266] },
  { id: 'blue', label: 'Blue', hex: '#3B82F6', rgb: [0.231, 0.509, 0.964] },
  { id: 'black', label: 'Black', hex: '#000000', rgb: [0, 0, 0] }
];

const POSITIONS = [
  { id: 'diagonal', label: 'Diagonal Center' },
  { id: 'center', label: 'Center' },
  { id: 'top-left', label: 'Top-Left' },
  { id: 'top-right', label: 'Top-Right' },
  { id: 'bottom-left', label: 'Bottom-Left' },
  { id: 'bottom-right', label: 'Bottom-Right' }
];

const APPLY_TO = [
  { id: 'all', label: 'All Pages' },
  { id: 'first', label: 'First Page Only' },
  { id: 'last', label: 'Last Page Only' }
];

export default function WatermarkPDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [pdfDocProxy, setPdfDocProxy] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const canvasRef = useRef(null);
  const [thumbnailRendered, setThumbnailRendered] = useState(false);

  // Watermark State
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(60);
  const [opacity, setOpacity] = useState(40);
  const [colorId, setColorId] = useState('gray');
  const [position, setPosition] = useState('diagonal');
  const [applyTo, setApplyTo] = useState('all');

  useEffect(() => {
    return () => {
      if (pdfDocProxy) pdfDocProxy.destroy();
    };
  }, [pdfDocProxy]);

  // Render thumbnail of page 1
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current) return;
    
    let renderTask = null;
    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const page = await pdfDocProxy.getPage(1);
        if (isCancelled) return;
        const viewport = page.getViewport({ scale: 0.5 }); // Scale down for preview
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!isCancelled) setThumbnailRendered(true);
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("Error rendering thumbnail", err);
        }
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDocProxy]);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    dispatch({ type: 'SET_INPUT_FILES', payload: [files[0]] });
    dispatch({ type: 'SET_ERROR', payload: '' });
    
    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setPdfDocProxy(pdf);
      setNumPages(pdf.numPages);
      setThumbnailRendered(false);
    } catch (error) {
      console.error("Error reading PDF:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Could not read PDF. It might be corrupted or protected.' });
      setNumPages(0);
    }
  };

  const removeFile = () => {
    dispatch({ type: 'SET_INPUT_FILES', payload: [] });
    if (pdfDocProxy) {
      pdfDocProxy.destroy();
      setPdfDocProxy(null);
    }
    setNumPages(0);
    setThumbnailRendered(false);
  };

  const handleWatermark = async () => {
    if (inputFiles.length === 0 || !text.trim()) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      
      const selectedColor = COLORS.find(c => c.id === colorId);
      const rgbColor = rgb(...selectedColor.rgb);
      const opacityValue = opacity / 100;

      for (let i = 0; i < pages.length; i++) {
        // Check applyTo logic
        if (applyTo === 'first' && i !== 0) continue;
        if (applyTo === 'last' && i !== pages.length - 1) continue;

        const page = pages[i];
        const { width, height } = page.getSize();
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        let x = 0, y = 0, rotate = degrees(0);
        const padding = 30; // Margin from edges

        switch (position) {
          case 'top-left':
            x = padding;
            y = height - padding - textHeight;
            break;
          case 'top-right':
            x = width - textWidth - padding;
            y = height - padding - textHeight;
            break;
          case 'bottom-left':
            x = padding;
            y = padding + textHeight;
            break;
          case 'bottom-right':
            x = width - textWidth - padding;
            y = padding + textHeight;
            break;
          case 'center':
            x = (width - textWidth) / 2;
            y = (height - textHeight) / 2;
            break;
          case 'diagonal':
            // Center the origin and rotate
            const angle = Math.atan2(height, width); // Calculate diagonal angle
            rotate = degrees((angle * 180) / Math.PI);
            x = width / 2 - (textWidth * Math.cos(angle)) / 2 + (textHeight * Math.sin(angle)) / 2;
            y = height / 2 - (textWidth * Math.sin(angle)) / 2 - (textHeight * Math.cos(angle)) / 2;
            break;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: rgbColor,
          opacity: opacityValue,
          rotate
        });

        const currentProgress = Math.round(((i + 1) / pages.length) * 100);
        if (i % 5 === 0 || i === pages.length - 1) {
          dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
        }
      }

      const watermarkedBytes = await pdfDoc.save();
      const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      const outName = 'watermarked.pdf';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'Watermark PDF',
        fileName: file.name,
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Watermark error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add watermark. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    if (pdfDocProxy) {
      pdfDocProxy.destroy();
      setPdfDocProxy(null);
    }
    setNumPages(0);
    setThumbnailRendered(false);
  };

  // Helper to generate CSS positioning for the live preview overlay
  const getPreviewStyle = () => {
    const selectedColor = COLORS.find(c => c.id === colorId);
    const baseStyle = {
      color: selectedColor.hex,
      opacity: opacity / 100,
      fontSize: `${Math.max(fontSize / 3, 10)}px`, // scaled down for thumbnail
      position: 'absolute',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      fontWeight: 'bold',
      fontFamily: 'Helvetica, Arial, sans-serif'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: '5%', left: '5%' };
      case 'top-right':
        return { ...baseStyle, top: '5%', right: '5%' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '5%', left: '5%' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '5%', right: '5%' };
      case 'center':
        return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'diagonal':
        return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(45deg)' };
      default:
        return baseStyle;
    }
  };

  return (
    <ToolPageLayout
      toolName="Watermark PDF"
      description="Stamp an image or text over your PDF in seconds. Choose typography, transparency, and position."
      icon={<Stamp className="w-8 h-8" />}
      iconColor="text-pink-500"
      iconBg="bg-pink-50"
    >
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-6">
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {inputFiles.length === 0 ? (
            <FileDropzone 
              accept={{ 'application/pdf': ['.pdf'] }} 
              multiple={false} 
              onFilesAccepted={handleFilesAccepted}
            />
          ) : (
            <div className="space-y-8">
              
              {/* Selected File Box */}
              <div className="flex items-center justify-between p-4 border border-muted/20 rounded-lg bg-surface">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="text-primary w-6 h-6 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text truncate max-w-[200px] sm:max-w-xs">{inputFiles[0].name}</span>
                    <span className="text-xs text-muted">{formatFileSize(inputFiles[0].size)} • {numPages} pages</span>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/10 shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Configuration Panel */}
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-text mb-2">Watermark Text</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full px-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-text mb-2 flex justify-between">
                        Font Size <span>{fontSize}</span>
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text mb-2 flex justify-between">
                        Opacity <span>{opacity}%</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-text mb-2">Color</label>
                      <div className="flex gap-2">
                        {COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setColorId(c.id)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${colorId === c.id ? 'scale-110 border-primary' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                            aria-label={`Select ${c.label}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text mb-2">Apply To</label>
                      <select 
                        value={applyTo}
                        onChange={e => setApplyTo(e.target.value)}
                        className="w-full p-2 border border-muted/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm"
                      >
                        {APPLY_TO.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text mb-2">Position</label>
                    <select 
                      value={position}
                      onChange={e => setPosition(e.target.value)}
                      className="w-full p-2 border border-muted/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm"
                    >
                      {POSITIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Live Preview Panel */}
                <div className="w-full md:w-[250px] shrink-0">
                  <label className="block text-sm font-bold text-text mb-2">Live Preview (Page 1)</label>
                  <div className="bg-surface p-3 rounded-lg border border-muted/20">
                    <div className="relative w-full aspect-[1/1.4] bg-white border border-muted/10 shadow-sm overflow-hidden flex items-center justify-center">
                      {!thumbnailRendered && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted text-xs animate-pulse">
                          Loading Preview...
                        </div>
                      )}
                      <canvas 
                        ref={canvasRef} 
                        className={`max-w-full max-h-full transition-opacity duration-300 ${!thumbnailRendered ? 'opacity-0' : 'opacity-100'}`}
                      />
                      {/* CSS-based Watermark Overlay */}
                      {text && thumbnailRendered && (
                        <div style={getPreviewStyle()} className="pointer-events-none drop-shadow-sm select-none">
                          {text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleWatermark}
                disabled={!text.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Stamp className="w-5 h-5" />
                Add Watermark
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message={`Stamping watermark on ${applyTo === 'all' ? numPages : 1} pages...`} />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Watermarked PDF"
        />
      )}
    </ToolPageLayout>
  );
}
