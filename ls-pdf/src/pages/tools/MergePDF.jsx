import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { GitMerge, ArrowUp, ArrowDown, X, GripVertical, File as FileIcon } from 'lucide-react';
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

export default function MergePDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const handleFilesAccepted = (files) => {
    dispatch({ type: 'SET_INPUT_FILES', payload: files });
  };

  const moveUp = (index) => {
    if (index > 0) {
      dispatch({ type: 'REORDER_INPUT_FILES', payload: { fromIndex: index, toIndex: index - 1 } });
    }
  };

  const moveDown = (index) => {
    if (index < inputFiles.length - 1) {
      dispatch({ type: 'REORDER_INPUT_FILES', payload: { fromIndex: index, toIndex: index + 1 } });
    }
  };

  const removeFile = (index) => {
    dispatch({ type: 'REMOVE_INPUT_FILE', payload: index });
  };

  const handleMerge = async () => {
    if (inputFiles.length < 2) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < inputFiles.length; i++) {
        const file = inputFiles[i];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));

        // Update progress dynamically
        const currentProgress = Math.round(((i + 1) / inputFiles.length) * 100);
        dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const outName = 'merged.pdf';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      // Save operation history locally
      await addHistoryEntry({
        toolName: 'Merge PDF',
        fileName: inputFiles[0].name + (inputFiles.length > 1 ? ` + ${inputFiles.length - 1} more` : ''),
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Merge error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to merge PDFs. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <ToolPageLayout
      toolName="Merge PDF"
      description="Combine multiple PDF files into a single document."
      icon={<GitMerge className="w-8 h-8" />}
      iconColor="text-red-500"
      iconBg="bg-red-50"
    >
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-6">
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm border border-red-100">
              {errorMessage}
            </div>
          )}

          <FileDropzone 
            accept={{ 'application/pdf': ['.pdf'] }} 
            multiple={true} 
            onFilesAccepted={handleFilesAccepted}
            value={inputFiles}
          />

          {inputFiles.length > 0 && (
            <div className="border border-muted/20 rounded-lg overflow-hidden bg-surface">
              {inputFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 border-b border-muted/20 last:border-b-0 bg-white hover:bg-surface transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <GripVertical className="text-muted/50 w-5 h-5 shrink-0" />
                    <FileIcon className="text-primary w-5 h-5 shrink-0" />
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <span className="text-sm font-medium text-text truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                      <span className="text-xs text-muted">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button 
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition-colors rounded hover:bg-muted/10"
                      aria-label="Move file up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveDown(idx)}
                      disabled={idx === inputFiles.length - 1}
                      className="p-1.5 text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition-colors rounded hover:bg-muted/10"
                      aria-label="Move file down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-muted/20 mx-1"></div>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-muted hover:text-primary transition-colors rounded hover:bg-primary/10"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inputFiles.length > 0 && (
            <button
              onClick={handleMerge}
              disabled={inputFiles.length < 2}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <GitMerge className="w-5 h-5" />
              {inputFiles.length < 2 ? 'Select at least 2 PDFs to merge' : 'Merge PDFs'}
            </button>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message={`Merging ${inputFiles.length} PDF files...`} />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Merged"
        />
      )}
    </ToolPageLayout>
  );
}
