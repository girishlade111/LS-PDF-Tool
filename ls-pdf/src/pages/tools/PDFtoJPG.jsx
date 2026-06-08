import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import JSZip from 'jszip';
import { Image as ImageIcon, File as FileIcon, X, AlertCircle, CheckSquare, Square } from 'lucide-react';
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

const QUALITY_OPTIONS = [
  { id: 72, label: 'Low', desc: '72 DPI - Best for screen viewing and email (Smallest size)' },
  { id: 150, label: 'Medium', desc: '150 DPI - Good for printing and general use (Balanced)' },
  { id: 300, label: 'High', desc: '300 DPI - High resolution, crisp text (Largest size)' }
];

const SelectableThumbnail = memo(({ pageIndex, isSelected, onToggle, pdfDoc }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || rendered || !pdfDoc || !canvasRef.current) return;
    let renderTask = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        if (isCancelled) return;
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!isCancelled) setRendered(true);
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageIndex + 1}`, err);
        }
      }
    };
    renderPage();
    return () => {
      isCancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [isVisible, rendered, pdfDoc, pageIndex]);

  return (
    <div 
      ref={containerRef} 
      onClick={() => onToggle(pageIndex)}
      className={`flex flex-col items-center bg-white p-2 rounded-lg border-2 shadow-sm transition-all cursor-pointer select-none ${isSelected ? 'border-primary bg-primary/5' : 'border-muted/20 hover:border-primary/30'}`}
    >
      <div className="relative w-full aspect-[1/1.4] flex items-center justify-center bg-surface mb-2 overflow-hidden rounded border border-muted/10">
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-xs animate-pulse">
            Loading...
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className={`max-w-full max-h-full transition-opacity duration-300 ${!rendered ? 'opacity-0' : 'opacity-100 shadow-sm'}`}
        />
        <div className="absolute top-2 left-2 bg-white rounded-md shadow-sm">
          {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted/50" />}
        </div>
      </div>
      <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-muted'}`}>Page {pageIndex + 1}</span>
    </div>
  );
});

export default function PDFtoJPG() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [pdfDocProxy, setPdfDocProxy] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [quality, setQuality] = useState(150); // dpi
  const [selectionMode, setSelectionMode] = useState('all'); // 'all' | 'select'
  const [selectedPages, setSelectedPages] = useState(new Set()); // set of zero-based indices

  useEffect(() => {
    return () => {
      if (pdfDocProxy) {
        pdfDocProxy.destroy();
      }
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
      
      // Default to selecting all pages when file is loaded
      const allSelected = new Set();
      for(let i = 0; i < pdf.numPages; i++) allSelected.add(i);
      setSelectedPages(allSelected);
      setSelectionMode('all');

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
    setSelectedPages(new Set());
  };

  const togglePageSelection = useCallback((idx) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleConvert = async () => {
    if (inputFiles.length === 0) return;
    
    const targetPages = selectionMode === 'all' 
      ? Array.from({ length: numPages }, (_, i) => i)
      : Array.from(selectedPages).sort((a, b) => a - b);

    if (targetPages.length === 0) return;

    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      const zip = new JSZip();
      const scale = quality / 72; // Convert target DPI to pdf.js scale factor

      for (let i = 0; i < targetPages.length; i++) {
        const pageIndex = targetPages[i];
        const page = await pdfDoc.getPage(pageIndex + 1);
        
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        
        // Ensure a white background (PDFs are transparent by default)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        
        // Convert canvas to JPG Blob
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
        zip.file(`page_${pageIndex + 1}.jpg`, blob);
        
        page.cleanup();

        const currentProgress = Math.round(((i + 1) / targetPages.length) * 100);
        dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
      }

      pdfDoc.destroy();

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const outName = 'pdf_images.zip';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: zipBlob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'PDF to JPG',
        fileName: file.name,
        fileSize: zipBlob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Convert error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to convert PDF. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    if (pdfDocProxy) {
      pdfDocProxy.destroy();
      setPdfDocProxy(null);
    }
    setNumPages(0);
    setSelectedPages(new Set());
    setSelectionMode('all');
  };

  const isConvertDisabled = selectionMode === 'select' && selectedPages.size === 0;

  return (
    <ToolPageLayout
      toolName="PDF to JPG"
      description="Convert each PDF page into a JPG image. Extract all pages or just the ones you need."
      icon={<ImageIcon className="w-8 h-8" />}
      iconColor="text-green-500"
      iconBg="bg-green-50"
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
            <div className="space-y-6">
              
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

              {/* Quality Levels */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-text">Image Quality (DPI)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {QUALITY_OPTIONS.map((option) => (
                    <label 
                      key={option.id} 
                      className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col gap-1 transition-colors ${
                        quality === option.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted/20 hover:border-primary/30 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="quality" 
                          value={option.id} 
                          checked={quality === option.id} 
                          onChange={() => setQuality(option.id)} 
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" 
                        />
                        <span className="font-bold text-text text-sm">{option.label}</span>
                      </div>
                      <span className="text-xs text-muted leading-relaxed pl-6">
                        {option.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3 pt-4 border-t border-muted/20">
                <label className="block text-sm font-bold text-text">Pages to Extract</label>
                <div className="flex bg-muted/10 p-1 rounded-lg">
                  <button
                    onClick={() => setSelectionMode('all')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selectionMode === 'all' ? 'bg-white shadow-sm text-text' : 'text-muted hover:text-text'}`}
                  >
                    All Pages ({numPages})
                  </button>
                  <button
                    onClick={() => setSelectionMode('select')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selectionMode === 'select' ? 'bg-white shadow-sm text-text' : 'text-muted hover:text-text'}`}
                  >
                    Select Pages
                  </button>
                </div>
              </div>

              {/* Thumbnails Grid for Selection */}
              {selectionMode === 'select' && pdfDocProxy && (
                <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 sm:p-6 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-text">
                      Selected: <span className="text-primary">{selectedPages.size}</span>
                    </span>
                    <button 
                      onClick={() => setSelectedPages(new Set())}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: numPages }).map((_, idx) => (
                      <SelectableThumbnail 
                        key={idx}
                        pageIndex={idx}
                        isSelected={selectedPages.has(idx)}
                        onToggle={togglePageSelection}
                        pdfDoc={pdfDocProxy}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleConvert}
                disabled={isConvertDisabled}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-5 h-5" />
                {selectionMode === 'select' && selectedPages.size > 0 
                  ? `Convert ${selectedPages.size} Page${selectedPages.size > 1 ? 's' : ''} to JPG`
                  : 'Convert to JPG'}
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus 
          progress={progress} 
          message={selectionMode === 'select' 
            ? `Converting ${selectedPages.size} pages to high-quality JPG...` 
            : `Converting ${numPages} pages to high-quality JPG...`} 
        />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Images ZIP"
        />
      )}
    </ToolPageLayout>
  );
}
