import { saveAs } from 'file-saver';
import { CheckCircle2, Download, RotateCcw } from 'lucide-react';

export default function DownloadResult({ outputFile, outputFileName, onReset, toolName = 'Processed' }) {
  const handleDownload = () => {
    if (outputFile && outputFileName) {
      saveAs(outputFile, outputFileName);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-surface border border-green-200 rounded-xl p-8 text-center space-y-6 animate-slide-up">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-green-600" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-text">Your file is ready!</h2>
        <p className="text-muted">
          {toolName} completed successfully
        </p>
      </div>
      <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-left space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Download size={18} className="text-green-600 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium text-text truncate">{outputFileName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-5" />
          <span>{outputFile ? formatFileSize(outputFile.size) : 'Unknown size'}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleDownload}
          disabled={!outputFile}
          className="w-full sm:w-auto flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 active:opacity-70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download size={20} aria-hidden="true" />
          Download {toolName} File
        </button>
        <button
          onClick={onReset}
          className="w-full sm:w-auto flex-1 px-6 py-3 border-2 border-muted/30 text-text font-semibold rounded-lg hover:border-primary hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} aria-hidden="true" />
          Process Another File
        </button>
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}