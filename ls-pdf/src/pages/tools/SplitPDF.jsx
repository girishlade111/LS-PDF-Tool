import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { Scissors, File as FileIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';
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

const parseRangeInput = (input, maxPages) => {
  if (!input.trim()) return { valid: false, error: 'Please enter a page range.', parsed: [] };
  
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  const parsed = [];
  
  for (const part of parts) {
    if (!/^\d+(-\d+)?$/.test(part)) {
      return { valid: false, error: `Invalid format: "${part}". Use numbers and dashes (e.g. 1-3).`, parsed: [] };
    }
    
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      
      if (start < 1 || end > maxPages || start > end) {
        return { valid: false, error: `Invalid range: "${part}". Pages must be between 1 and ${maxPages}, and start <= end.`, parsed: [] };
      }
      
      const indices = [];
      for (let i = start; i <= end; i++) {
        indices.push(i - 1);
      }
      parsed.push({ label: part, indices });
    } else {
      const page = parseInt(part, 10);
      if (page < 1 || page > maxPages) {
        return { valid: false, error: `Invalid page: "${part}". Must be between 1 and ${maxPages}.`, parsed: [] };
      }
      parsed.push({ label: part, indices: [page - 1] });
    }
  }
  
  return { valid: true, error: '', parsed };
};

export default function SplitPDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [numPages, setNumPages] = useState(0);
  const [splitMode, setSplitMode] = useState('all'); // 'all' | 'range'
  const [rangeInput, setRangeInput] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [parsedRanges, setParsedRanges] = useState([]);

  useEffect(() => {
    if (splitMode === 'range') {
      const result = parseRangeInput(rangeInput, numPages);
      setRangeError(result.error);
      if (result.valid) {
        setParsedRanges(result.parsed);
      } else {
        setParsedRanges([]);
      }
    } else {
      setRangeError('');
      setParsedRanges([]);
    }
  }, [rangeInput, splitMode, numPages]);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    
    // Split tool only accepts one file at a time
    const file = files[0];
    dispatch({ type: 'SET_INPUT_FILES', payload: [file] });
    dispatch({ type: 'SET_ERROR', payload: '' });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setNumPages(pdf.numPages);
      
      // Reset inputs
      setSplitMode('all');
      setRangeInput('');
      setParsedRanges([]);
      setRangeError('');
    } catch (error) {
      console.error("Error reading PDF:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Could not read PDF. It might be corrupted or protected.' });
      setNumPages(0);
    }
  };

  const removeFile = () => {
    dispatch({ type: 'SET_INPUT_FILES', payload: [] });
    setNumPages(0);
  };

  const handleSplit = async () => {
    if (inputFiles.length === 0) return;
    if (splitMode === 'range' && (!rangeInput.trim() || rangeError)) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const zip = new JSZip();

      // Determine the tasks (PDFs to extract)
      let tasks = [];
      if (splitMode === 'all') {
        for (let i = 0; i < numPages; i++) {
          tasks.push({ label: `${i + 1}`, indices: [i] });
        }
      } else {
        tasks = parsedRanges;
      }

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(sourcePdf, task.indices);
        pages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        zip.file(`page_${task.label}.pdf`, pdfBytes);

        // Update progress dynamically
        const currentProgress = Math.round(((i + 1) / tasks.length) * 100);
        dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const outName = 'split_pages.zip';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: zipBlob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      // Save operation history locally
      await addHistoryEntry({
        toolName: 'Split PDF',
        fileName: file.name,
        fileSize: zipBlob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Split error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to split PDF. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setNumPages(0);
    setSplitMode('all');
    setRangeInput('');
    setParsedRanges([]);
    setRangeError('');
  };

  return (
    <ToolPageLayout
      toolName="Split PDF"
      description="Extract pages from your PDF or save each page as a separate PDF."
      icon={<Scissors className="w-8 h-8" />}
      iconColor="text-orange-500"
      iconBg="bg-orange-50"
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

              {/* Mode Selection */}
              <div className="flex bg-muted/10 p-1 rounded-lg">
                <button
                  onClick={() => setSplitMode('all')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${splitMode === 'all' ? 'bg-white shadow-sm text-text' : 'text-muted hover:text-text'}`}
                >
                  Split All Pages
                </button>
                <button
                  onClick={() => setSplitMode('range')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${splitMode === 'range' ? 'bg-white shadow-sm text-text' : 'text-muted hover:text-text'}`}
                >
                  Split by Range
                </button>
              </div>

              {/* Range Input Settings */}
              {splitMode === 'range' && (
                <div className="p-4 border border-muted/20 rounded-lg bg-white space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Custom Page Ranges
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1-3, 5, 7-9"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        rangeError ? 'border-red-300 focus:ring-red-200' : 'border-muted/30 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    {rangeError && (
                      <p className="text-red-500 text-sm mt-2 font-medium">{rangeError}</p>
                    )}
                  </div>

                  {/* Valid Range Preview */}
                  {!rangeError && parsedRanges.length > 0 && (
                    <div className="bg-green-50/50 p-3 rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Will extract {parsedRanges.length} PDF{parsedRanges.length > 1 ? 's' : ''}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parsedRanges.map((range, idx) => (
                          <span key={idx} className="bg-white border border-green-200 text-green-700 text-xs px-2 py-1 rounded-md font-medium shadow-sm">
                            {range.label.includes('-') ? `Pages ${range.label}` : `Page ${range.label}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleSplit}
                disabled={splitMode === 'range' && (!rangeInput.trim() || !!rangeError)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Scissors className="w-5 h-5" />
                Split PDF
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message={splitMode === 'all' ? `Splitting ${numPages} pages...` : `Splitting PDF into ${parsedRanges.length} parts...`} />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Split ZIP"
        />
      )}
    </ToolPageLayout>
  );
}
