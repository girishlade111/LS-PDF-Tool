import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, X, AlertCircle } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateFileName(name, maxLength = 30) {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop();
  const base = name.slice(0, name.lastIndexOf('.'));
  const truncatedBase = base.slice(0, maxLength - ext.length - 4);
  return `${truncatedBase}...${ext}`;
}

export default function FileDropzone({
  accept = { 'application/pdf': ['.pdf'] },
  multiple = false,
  maxSize = Infinity,
  onFilesAccepted,
  label = 'Drop PDF files here',
  sublabel = 'or click to browse',
}) {
  const [acceptedFiles, setAcceptedFiles] = useState([]);
  const [fileRejections, setFileRejections] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((accepted, rejections) => {
    setAcceptedFiles(accepted);
    setFileRejections(rejections);
    if (accepted.length > 0) {
      onFilesAccepted?.(accepted);
    }
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
    noClick: false,
    noKeyboard: false,
  });

  const handleRemoveFile = (index) => {
    const newFiles = acceptedFiles.filter((_, i) => i !== index);
    setAcceptedFiles(newFiles);
    onFilesAccepted?.(newFiles);
  };

  const handleClearAll = () => {
    setAcceptedFiles([]);
    onFilesAccepted?.([]);
  };

  const isError = isDragReject || fileRejections.length > 0;
  const borderColor = isError ? 'border-red-500' : isDragActive ? 'border-primary' : 'border-muted/30';
  const bgColor = isDragActive ? 'bg-red-50' : 'bg-background';

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${borderColor} ${bgColor}`}
        onDragEnter={() => setIsDragActive(true)}
        onDragLeave={() => setIsDragActive(false)}
        onDragOver={() => setIsDragActive(true)}
        onDrop={() => setIsDragActive(false)}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Upload size={28} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-medium text-text">{label}</p>
            <p className="text-sm text-muted mt-1">{sublabel}</p>
            {!multiple && <p className="text-xs text-muted mt-2">Single file only</p>}
          </div>
        </div>
      </div>

      {isError && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={18} aria-hidden="true" />
          <span>
            {fileRejections.length > 0
              ? fileRejections.map((r, i) => (
                  <span key={i} className="block">
                    {r.file.name}: {r.errors.map(e => e.message).join(', ')}
                  </span>
                ))
              : 'Invalid file type or size'}
          </span>
        </div>
      )}

      {acceptedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {acceptedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between p-3 bg-surface border border-muted/20 rounded-lg animate-slide-in"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileIcon size={20} className="text-muted flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate" title={file.name}>
                    {truncateFileName(file.name)}
                  </p>
                  <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          {multiple && acceptedFiles.length > 1 && (
            <button
              onClick={handleClearAll}
              className="w-full text-sm text-muted hover:text-primary transition-colors p-2"
            >
              Clear all ({acceptedFiles.length})
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}