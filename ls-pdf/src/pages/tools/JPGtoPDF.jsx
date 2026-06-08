import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileImage, X, AlertCircle, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import ToolPageLayout from '../../components/common/ToolPageLayout';
import FileDropzone from '../../components/common/FileDropzone';
import ProcessingStatus from '../../components/common/ProcessingStatus';
import DownloadResult from '../../components/common/DownloadResult';
import { useFileStore } from '../../context/FileStoreContext';
import { addHistoryEntry } from '../../utils/indexedDBUtils';

const PAGE_SIZES = {
  a4: { label: 'A4', dims: [595.28, 841.89] },
  letter: { label: 'US Letter', dims: [612, 792] },
  original: { label: 'Original Image Size', dims: null }
};

const MARGINS = {
  none: { label: 'None', value: 0 },
  small: { label: 'Small (10pt)', value: 10 },
  medium: { label: 'Medium (20pt)', value: 20 }
};

const ImageThumbnail = ({ file, index, total, onMoveLeft, onMoveRight, onRemove }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-muted/20 shadow-sm relative group hover:border-primary/30 transition-colors">
      <div className="relative w-full aspect-square flex items-center justify-center bg-surface mb-2 overflow-hidden rounded border border-muted/10">
        {url ? (
          <img src={url} alt={file.name} className="object-cover w-full h-full" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted/30" />
        )}
      </div>
      <div className="flex items-center justify-between w-full mt-1">
        <button 
          onClick={onMoveLeft} 
          disabled={index === 0}
          className="p-1 text-muted hover:text-text disabled:opacity-30 rounded hover:bg-muted/10 transition-colors"
          aria-label="Move left"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-text truncate max-w-[60px]">{index + 1}</span>
        </div>
        <button 
          onClick={onMoveRight} 
          disabled={index === total - 1}
          className="p-1 text-muted hover:text-text disabled:opacity-30 rounded hover:bg-muted/10 transition-colors"
          aria-label="Move right"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <button 
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-white border border-muted/20 text-muted hover:text-primary rounded-full p-1 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default function JPGtoPDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('none');

  const handleFilesAccepted = (files) => {
    // Append to existing instead of replacing so users can add more
    dispatch({ type: 'SET_INPUT_FILES', payload: [...inputFiles, ...files] });
    dispatch({ type: 'SET_ERROR', payload: '' });
  };

  const removeFile = (index) => {
    dispatch({ type: 'REMOVE_INPUT_FILE', payload: index });
  };

  const moveLeft = (index) => {
    if (index > 0) {
      dispatch({ type: 'REORDER_INPUT_FILES', payload: { fromIndex: index, toIndex: index - 1 } });
    }
  };

  const moveRight = (index) => {
    if (index < inputFiles.length - 1) {
      dispatch({ type: 'REORDER_INPUT_FILES', payload: { fromIndex: index, toIndex: index + 1 } });
    }
  };

  const handleConvert = async () => {
    if (inputFiles.length === 0) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < inputFiles.length; i++) {
        const file = inputFiles[i];
        let imageBytes = await file.arrayBuffer();
        let image;

        // pdf-lib directly supports embedding JPEG and PNG.
        if (file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // Fallback for WebP or other images: draw to canvas and encode as PNG
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0);
          const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
          imageBytes = await blob.arrayBuffer();
          image = await pdfDoc.embedPng(imageBytes);
        }

        let width, height;
        if (pageSize === 'original') {
          width = image.width;
          height = image.height;
        } else {
          [width, height] = PAGE_SIZES[pageSize].dims;
          if (orientation === 'landscape') {
            [width, height] = [height, width];
          }
        }

        const page = pdfDoc.addPage([width, height]);
        const marginValue = MARGINS[margin].value;
        
        const imgDims = image.scaleToFit(width - marginValue * 2, height - marginValue * 2);
        
        page.drawImage(image, {
          x: marginValue + (width - marginValue * 2 - imgDims.width) / 2,
          y: marginValue + (height - marginValue * 2 - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });

        const currentProgress = Math.round(((i + 1) / inputFiles.length) * 100);
        dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
      }

      const mergedBytes = await pdfDoc.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const outName = 'images_to_pdf.pdf';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'JPG to PDF',
        fileName: `${inputFiles.length} Image${inputFiles.length > 1 ? 's' : ''}`,
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Convert error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to convert images to PDF. ' + (error.message || 'An image might be corrupted or unsupported.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setPageSize('a4');
    setOrientation('portrait');
    setMargin('none');
  };

  return (
    <ToolPageLayout
      toolName="JPG to PDF"
      description="Convert JPG, PNG, and WebP images to PDF in seconds. Easily adjust orientation and margins."
      icon={<FileImage className="w-8 h-8" />}
      iconColor="text-amber-500"
      iconBg="bg-amber-50"
    >
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-6">
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <FileDropzone 
            accept={{ 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }} 
            multiple={true} 
            onFilesAccepted={handleFilesAccepted}
            label="Drop images here"
            sublabel="Supports JPG, PNG, WebP"
            value={inputFiles} // pass state down so Dropzone doesn't manage it internally
          />

          {inputFiles.length > 0 && (
            <div className="space-y-6">
              
              {/* Settings Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-surface p-5 border border-muted/20 rounded-xl">
                {/* Page Size */}
                <div>
                  <label className="block text-sm font-bold text-text mb-2">Page Size</label>
                  <select 
                    value={pageSize}
                    onChange={e => setPageSize(e.target.value)}
                    className="w-full p-2 border border-muted/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">US Letter</option>
                    <option value="original">Original Image Size</option>
                  </select>
                </div>
                
                {/* Orientation */}
                <div>
                  <label className="block text-sm font-bold text-text mb-2">Orientation</label>
                  <select 
                    value={orientation}
                    onChange={e => setOrientation(e.target.value)}
                    disabled={pageSize === 'original'}
                    className="w-full p-2 border border-muted/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                {/* Margin */}
                <div>
                  <label className="block text-sm font-bold text-text mb-2">Margin</label>
                  <select 
                    value={margin}
                    onChange={e => setMargin(e.target.value)}
                    className="w-full p-2 border border-muted/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm"
                  >
                    {Object.entries(MARGINS).map(([key, obj]) => (
                      <option key={key} value={key}>{obj.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 sm:p-6 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-text">
                    Images Selected: <span className="text-primary">{inputFiles.length}</span>
                  </span>
                  <button 
                    onClick={() => dispatch({ type: 'SET_INPUT_FILES', payload: [] })}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {inputFiles.map((file, idx) => (
                    <ImageThumbnail 
                      key={`${file.name}-${idx}`}
                      file={file}
                      index={idx}
                      total={inputFiles.length}
                      onMoveLeft={() => moveLeft(idx)}
                      onMoveRight={() => moveRight(idx)}
                      onRemove={() => removeFile(idx)}
                    />
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleConvert}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <FileImage className="w-5 h-5" />
                Convert {inputFiles.length} Image{inputFiles.length > 1 ? 's' : ''} to PDF
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message={`Converting ${inputFiles.length} images to PDF...`} />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="PDF"
        />
      )}
    </ToolPageLayout>
  );
}
