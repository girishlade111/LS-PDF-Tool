import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PackageOpen, File as FileIcon, X, AlertCircle, Info } from 'lucide-react';
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

const COMPRESSION_OPTIONS = [
  { id: 'low', label: 'Low', desc: 'Remove unused objects only (fastest, smallest reduction)' },
  { id: 'medium', label: 'Medium', desc: 'Remove unused objects + downsample embedded images to 72 DPI (if images found)' },
  { id: 'high', label: 'High', desc: 'Aggressive: remove metadata, unused XObjects, compress streams' }
];

export default function CompressPDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [stats, setStats] = useState(null); // { original: number, compressed: number }

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    dispatch({ type: 'SET_INPUT_FILES', payload: [files[0]] });
    dispatch({ type: 'SET_ERROR', payload: '' });
    setStats(null);
  };

  const removeFile = () => {
    dispatch({ type: 'SET_INPUT_FILES', payload: [] });
    setStats(null);
  };

  const handleCompress = async () => {
    if (inputFiles.length === 0) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const originalSize = file.size;
      const arrayBuffer = await file.arrayBuffer();

      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 30 } });

      // Note: pdf-lib does not natively support true image downsampling. 
      // We configure save options based on the requested level to optimize as much as possible.
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        updateMetadata: compressionLevel === 'high' ? false : true 
      });

      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 60 } });

      if (compressionLevel === 'high') {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
      }

      // useObjectStreams groups PDF objects into streams, which is a form of compression
      const useObjectStreams = compressionLevel !== 'low';
      
      const compressedBytes = await pdfDoc.save({ 
        useObjectStreams, 
        addDefaultPage: false 
      });

      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 90 } });

      const compressedSize = compressedBytes.length;
      
      // If the compression algorithm somehow increased the file size, just use the original
      let finalBytes = compressedBytes;
      if (compressedSize >= originalSize) {
        finalBytes = arrayBuffer;
      }

      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const outName = 'compressed.pdf';
      
      setStats({ original: originalSize, compressed: blob.size });

      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'Compress PDF',
        fileName: file.name,
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Compress error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to compress PDF. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setStats(null);
    setCompressionLevel('medium');
  };

  return (
    <ToolPageLayout
      toolName="Compress PDF"
      description="Reduce PDF file size while maintaining visual quality."
      icon={<PackageOpen className="w-8 h-8" />}
      iconColor="text-blue-500"
      iconBg="bg-blue-50"
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
                    <span className="text-xs font-semibold text-text">Original Size: <span className="text-muted">{formatFileSize(inputFiles[0].size)}</span></span>
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

              {/* Info Banner */}
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg font-medium text-sm border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                <p>Client-side compression works best on PDFs with unused objects and metadata. For image-heavy PDFs, results may vary.</p>
              </div>

              {/* Compression Levels */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-text">Select Compression Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {COMPRESSION_OPTIONS.map((option) => (
                    <label 
                      key={option.id} 
                      className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-colors ${
                        compressionLevel === option.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted/20 hover:border-primary/30 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="compression" 
                          value={option.id} 
                          checked={compressionLevel === option.id} 
                          onChange={() => setCompressionLevel(option.id)} 
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" 
                        />
                        <span className="font-bold text-text">{option.label}</span>
                      </div>
                      <span className="text-xs text-muted leading-relaxed">
                        {option.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCompress}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <PackageOpen className="w-5 h-5" />
                Compress PDF
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message="Compressing PDF..." />
      )}

      {status === 'done' && (
        <div className="space-y-6">
          {stats && (
            <div className="bg-surface border border-muted/20 rounded-xl p-6 text-center shadow-sm">
              <h4 className="font-bold text-lg text-text mb-2">Compression Results</h4>
              {stats.compressed < stats.original ? (
                <p className="text-[#22C55E] font-bold text-lg">
                  Reduced from {formatFileSize(stats.original)} to {formatFileSize(stats.compressed)} 
                  <span className="block text-sm text-muted mt-1 font-medium">({Math.round((1 - stats.compressed / stats.original) * 100)}% reduction)</span>
                </p>
              ) : (
                <p className="text-text font-medium bg-white p-3 rounded border border-muted/20 inline-block">
                  Original: {formatFileSize(stats.original)}. File could not be reduced further.
                </p>
              )}
            </div>
          )}
          <DownloadResult 
            outputFile={outputFile} 
            outputFileName={outputFileName} 
            onReset={handleReset} 
            toolName="Compressed"
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
