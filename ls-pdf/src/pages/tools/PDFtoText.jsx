import React, { useState, useEffect } from 'react';
import { FileText, File as FileIcon, X, AlertCircle, Info, Copy, Download, CheckCircle2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { pdfjsLib } from '../../utils/pdfUtils';
import ToolPageLayout from '../../components/common/ToolPageLayout';
import FileDropzone from '../../components/common/FileDropzone';
import ProcessingStatus from '../../components/common/ProcessingStatus';
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
      
      for (let i = start; i <= end; i++) {
        if (!parsed.includes(i)) parsed.push(i);
      }
    } else {
      const page = parseInt(part, 10);
      if (page < 1 || page > maxPages) {
        return { valid: false, error: `Invalid page: "${part}". Must be between 1 and ${maxPages}.`, parsed: [] };
      }
      if (!parsed.includes(page)) parsed.push(page);
    }
  }
  
  return { valid: true, error: '', parsed: parsed.sort((a, b) => a - b) };
};

export default function PDFtoText() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, status, progress, errorMessage } = state;

  const [numPages, setNumPages] = useState(0);
  const [extractMode, setExtractMode] = useState('all'); // 'all' | 'range'
  const [rangeInput, setRangeInput] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [parsedRanges, setParsedRanges] = useState([]);
  const [format, setFormat] = useState('plain'); // 'plain' | 'markdown'
  
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (extractMode === 'range') {
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
  }, [rangeInput, extractMode, numPages]);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    dispatch({ type: 'SET_INPUT_FILES', payload: [files[0]] });
    dispatch({ type: 'SET_ERROR', payload: '' });
    setExtractedText('');
    setCopied(false);
    
    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setNumPages(pdf.numPages);
      setExtractMode('all');
      setRangeInput('');
    } catch (error) {
      console.error("Error reading PDF:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Could not read PDF. It might be corrupted or protected.' });
      setNumPages(0);
    }
  };

  const removeFile = () => {
    dispatch({ type: 'SET_INPUT_FILES', payload: [] });
    setNumPages(0);
    setExtractedText('');
  };

  const handleExtract = async () => {
    if (inputFiles.length === 0) return;
    if (extractMode === 'range' && (!rangeInput.trim() || rangeError)) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });
    setExtractedText('');
    setCopied(false);

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const targetPages = extractMode === 'all' 
        ? Array.from({ length: numPages }, (_, i) => i + 1)
        : parsedRanges;

      let fullText = '';

      for (let i = 0; i < targetPages.length; i++) {
        const pageNum = targetPages[i];
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Simple heuristic to join text. May not preserve complex column layouts perfectly.
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        if (format === 'markdown') {
          fullText += `## Page ${pageNum}\n\n${pageText}\n\n`;
        } else {
          // If not the very first page, add some spacing
          if (fullText.length > 0) fullText += '\n\n';
          fullText += pageText;
        }

        const currentProgress = Math.round(((i + 1) / targetPages.length) * 100);
        dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: currentProgress } });
      }

      setExtractedText(fullText.trim());
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'PDF to Text',
        fileName: file.name,
        fileSize: file.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Extract error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to extract text. ' + (error.message || 'The file might be corrupted or protected against copying.') });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, format === 'markdown' ? 'extracted_text.md' : 'extracted_text.txt');
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setNumPages(0);
    setExtractMode('all');
    setRangeInput('');
    setExtractedText('');
    setCopied(false);
  };

  const isExtractDisabled = extractMode === 'range' && (!rangeInput.trim() || !!rangeError);
  
  // Calculate text stats safely
  const wordCount = extractedText ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;

  return (
    <ToolPageLayout
      toolName="PDF to Text"
      description="Extract text from your PDF document into a simple, editable format."
      icon={<FileText className="w-8 h-8" />}
      iconColor="text-indigo-500"
      iconBg="bg-indigo-50"
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

              {/* Warning Banner */}
              <div className="bg-amber-50 text-amber-800 p-4 rounded-lg font-medium text-sm border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <p>Text extraction works best with digital PDFs. Scanned PDFs (images of text) may return empty or garbled results.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Extraction Range */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-text">Pages to Extract</label>
                  <div className="flex bg-muted/10 p-1 rounded-lg">
                    <button
                      onClick={() => setExtractMode('all')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${extractMode === 'all' ? 'bg-white shadow-sm text-text' : 'text-muted hover:text-text'}`}
                    >
                      All Pages
                    </button>
                    <button
                      onClick={() => setExtractMode('range')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${extractMode === 'range' ? 'bg-white shadow-sm text-text' : 'text-muted hover:text-text'}`}
                    >
                      Page Range
                    </button>
                  </div>

                  {extractMode === 'range' && (
                    <div className="p-3 border border-muted/20 rounded-lg bg-white mt-2">
                      <input
                        type="text"
                        placeholder={`e.g. 1-${Math.min(3, numPages)}, ${numPages}`}
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
                          rangeError ? 'border-red-300 focus:ring-red-200' : 'border-muted/30 focus:ring-primary/20 focus:border-primary'
                        }`}
                      />
                      {rangeError && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium">{rangeError}</p>
                      )}
                      {!rangeError && parsedRanges.length > 0 && (
                        <p className="text-[#22C55E] text-xs mt-1.5 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Selected {parsedRanges.length} page(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Output Format */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-text">Output Format</label>
                  <div className="grid grid-cols-2 gap-3 h-[44px]"> {/* Matching height with mode selector */}
                    <label 
                      className={`cursor-pointer border-2 rounded-lg flex items-center justify-center transition-colors ${
                        format === 'plain' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-muted/20 hover:border-primary/30 bg-white text-muted font-medium'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="format" 
                        value="plain" 
                        checked={format === 'plain'} 
                        onChange={() => setFormat('plain')} 
                        className="hidden" 
                      />
                      Plain Text
                    </label>
                    <label 
                      className={`cursor-pointer border-2 rounded-lg flex items-center justify-center transition-colors ${
                        format === 'markdown' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-muted/20 hover:border-primary/30 bg-white text-muted font-medium'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="format" 
                        value="markdown" 
                        checked={format === 'markdown'} 
                        onChange={() => setFormat('markdown')} 
                        className="hidden" 
                      />
                      Markdown
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExtract}
                disabled={isExtractDisabled}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                Extract Text
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus 
          progress={progress} 
          message={extractMode === 'range' 
            ? `Extracting text from ${parsedRanges.length} pages...` 
            : `Extracting text from all ${numPages} pages...`} 
        />
      )}

      {status === 'done' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex items-center gap-2 text-[#22C55E] justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-xl font-bold text-text">Text Extracted Successfully</h3>
          </div>

          <div className="bg-white border border-muted/20 rounded-xl overflow-hidden shadow-sm">
            {/* Textarea Preview */}
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-[350px] p-4 font-mono text-sm text-text bg-surface resize-none focus:outline-none custom-scrollbar"
              placeholder="No text was found in this document."
            />
            
            {/* Stats Bar */}
            <div className="flex justify-between items-center px-4 py-2 border-t border-b border-muted/20 bg-white text-xs font-semibold text-muted">
              <span>{wordCount.toLocaleString()} Words</span>
              <span>{charCount.toLocaleString()} Characters</span>
            </div>

            {/* Actions */}
            <div className="p-4 bg-muted/5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg transition-colors border-2 ${
                  copied 
                    ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' 
                    : 'bg-white border-muted/20 hover:border-primary hover:text-primary text-text shadow-sm'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-primary/90 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download as .{format === 'markdown' ? 'md' : 'txt'}
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full text-center text-sm font-semibold text-muted hover:text-primary transition-colors py-2"
          >
            Extract text from another PDF
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
