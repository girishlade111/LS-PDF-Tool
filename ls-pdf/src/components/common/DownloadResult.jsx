import React from 'react';
import { CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { saveAs } from 'file-saver';

export default function DownloadResult({ 
  outputFile, 
  outputFileName, 
  onReset, 
  toolName = 'PDF' 
}) {
  const handleDownload = () => {
    if (outputFile && outputFileName) {
      saveAs(outputFile, outputFileName);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-surface border border-muted/20 rounded-xl shadow-sm text-center">
      <CheckCircle2 className="w-16 h-16 text-[#22C55E] mb-4" />
      <h3 className="text-2xl font-bold text-text mb-2">Your file is ready!</h3>
      
      <div className="bg-muted/10 border border-muted/20 rounded-lg px-4 py-3 w-full max-w-md mb-8 flex items-center justify-center">
        <p className="text-muted font-medium truncate" title={outputFileName}>
          {outputFileName}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
        >
          <Download className="w-5 h-5" />
          Download {toolName} File
        </button>
        
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent border-2 border-primary text-primary hover:bg-primary/5 font-semibold py-3 px-6 rounded-lg transition-colors w-full"
        >
          <RefreshCw className="w-5 h-5" />
          Process Another File
        </button>
      </div>
    </div>
  );
}
