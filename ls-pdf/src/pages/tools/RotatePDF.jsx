import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { RotateCw, RotateCcw, File as FileIcon, X, AlertCircle } from 'lucide-react';
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

// Memoized Thumbnail Component with Lazy Loading (Intersection Observer)
const PageThumbnail = memo(({ pageIndex, rotation, onRotateCw, onRotateCcw, pdfDoc }) => {
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

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || rendered || !pdfDoc || !canvasRef.current) return;

    let renderTask = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageIndex + 1); // pdfjs is 1-based
        if (isCancelled) return;
        
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setRendered(true);
        }
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageIndex + 1}`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [isVisible, rendered, pdfDoc, pageIndex]);

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col items-center bg-white p-3 rounded-lg border border-muted/20 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative w-full aspect-[1/1.4] flex items-center justify-center bg-surface mb-3 overflow-hidden rounded border border-muted/10">
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-xs animate-pulse">
            Loading...
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className={`max-w-full max-h-full transition-transform duration-300 ${!rendered ? 'opacity-0' : 'opacity-100 shadow-sm'}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      
      <span className="text-xs font-bold text-muted mb-2">Page {pageIndex + 1}</span>
      
      <div className="flex items-center gap-2 w-full">
        <button 
          onClick={() => onRotateCcw(pageIndex)}
          className="flex-1 flex justify-center py-1.5 bg-surface hover:bg-muted/10 text-text rounded transition-colors"
          title="Rotate Counter-Clockwise"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onRotateCw(pageIndex)}
          className="flex-1 flex justify-center py-1.5 bg-surface hover:bg-muted/10 text-text rounded transition-colors"
          title="Rotate Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default function RotatePDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [pdfDocProxy, setPdfDocProxy] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [rotations, setRotations] = useState([]); // Array tracking rotation degrees per page

  // Cleanup PDF doc proxy to prevent memory leaks when component unmounts
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
      // Load via pdfjs for thumbnail rendering
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setPdfDocProxy(pdf);
      setNumPages(pdf.numPages);
      setRotations(new Array(pdf.numPages).fill(0));
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
    setRotations([]);
  };

  const handleRotateCw = useCallback((idx) => {
    setRotations(prev => {
      const copy = [...prev];
      copy[idx] += 90;
      return copy;
    });
  }, []);

  const handleRotateCcw = useCallback((idx) => {
    setRotations(prev => {
      const copy = [...prev];
      copy[idx] -= 90;
      return copy;
    });
  }, []);

  const handleRotateAll = (deg) => {
    setRotations(prev => prev.map(r => r + deg));
  };

  const handleApply = async () => {
    if (inputFiles.length === 0) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      
      // Use pdf-lib for the actual file modification
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for(let i = 0; i < pages.length; i++) {
        const currentRotation = pages[i].getRotation().angle;
        const additionalRotation = rotations[i] || 0;
        
        // Combine current existing rotation with user's new additions
        pages[i].setRotation(degrees(currentRotation + additionalRotation));

        // Update progress smoothly
        if (i % 5 === 0 || i === pages.length - 1) {
          const currentProgress = Math.round(((i + 1) / pages.length) * 100);
          dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
        }
      }

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const outName = 'rotated.pdf';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'Rotate PDF',
        fileName: file.name,
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Apply error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to rotate PDF. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    if (pdfDocProxy) {
      pdfDocProxy.destroy();
      setPdfDocProxy(null);
    }
    setNumPages(0);
    setRotations([]);
  };

  return (
    <ToolPageLayout
      toolName="Rotate PDF"
      description="Rotate your PDFs the way you need them. You can rotate individual pages or all pages at once."
      icon={<RotateCw className="w-8 h-8" />}
      iconColor="text-purple-500"
      iconBg="bg-purple-50"
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
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-muted/20 rounded-lg bg-surface gap-4">
                <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                  <FileIcon className="text-primary w-6 h-6 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text truncate max-w-[200px] sm:max-w-xs">{inputFiles[0].name}</span>
                    <span className="text-xs text-muted">{formatFileSize(inputFiles[0].size)} • {numPages} pages</span>
                  </div>
                </div>
                
                {/* Global Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                  <div className="flex items-center gap-1 bg-white border border-muted/20 rounded-md p-1 shadow-sm">
                    <button 
                      onClick={() => handleRotateAll(-90)}
                      className="px-3 py-1.5 text-xs font-semibold text-text hover:bg-muted/10 rounded transition-colors flex items-center gap-1"
                    >
                      All <RotateCcw className="w-3 h-3" />
                    </button>
                    <div className="w-px h-4 bg-muted/20"></div>
                    <button 
                      onClick={() => handleRotateAll(180)}
                      className="px-3 py-1.5 text-xs font-semibold text-text hover:bg-muted/10 rounded transition-colors"
                    >
                      All 180°
                    </button>
                    <div className="w-px h-4 bg-muted/20"></div>
                    <button 
                      onClick={() => handleRotateAll(90)}
                      className="px-3 py-1.5 text-xs font-semibold text-text hover:bg-muted/10 rounded transition-colors flex items-center gap-1"
                    >
                      All <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={removeFile}
                    className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/10 ml-2"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnails Grid */}
              {pdfDocProxy && (
                <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 sm:p-6 max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: numPages }).map((_, idx) => (
                      <PageThumbnail 
                        key={idx}
                        pageIndex={idx}
                        rotation={rotations[idx] || 0}
                        onRotateCw={handleRotateCw}
                        onRotateCcw={handleRotateCcw}
                        pdfDoc={pdfDocProxy}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <RotateCw className="w-5 h-5" />
                Apply Rotation
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message={`Rotating PDF pages...`} />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Rotated"
        />
      )}
    </ToolPageLayout>
  );
}
