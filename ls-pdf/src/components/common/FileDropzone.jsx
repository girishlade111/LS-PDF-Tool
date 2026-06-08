import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, X } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function FileDropzone({
  accept = { 'application/pdf': ['.pdf'] },
  multiple = false,
  maxSize = Infinity,
  onFilesAccepted,
  label = 'Drop PDF files here',
  sublabel = 'or click to browse',
  value // optional external state
}) {
  const [internalFiles, setInternalFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Use controlled value if provided, else fall back to internal state
  const files = value !== undefined ? value : internalFiles;

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setErrorMessage('');

    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-invalid-type') {
        setErrorMessage('Invalid file type. Please upload accepted files.');
      } else if (error.code === 'file-too-large') {
        setErrorMessage(`File is too large. Max size is ${formatFileSize(maxSize)}.`);
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const newFiles = multiple ? [...files, ...acceptedFiles] : acceptedFiles;
      if (value === undefined) {
        setInternalFiles(newFiles);
      }
      if (onFilesAccepted) {
        onFilesAccepted(newFiles);
      }
    }
  }, [files, multiple, maxSize, onFilesAccepted, value]);

  const removeFile = (indexToRemove) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    if (value === undefined) {
      setInternalFiles(newFiles);
    }
    if (onFilesAccepted) {
      onFilesAccepted(newFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-[#FFF5F5]'
            : 'border-muted/30 bg-surface hover:bg-muted/5'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-primary mb-4" />
        <p className="text-lg font-semibold text-text text-center">{label}</p>
        <p className="text-sm text-muted text-center mt-1">{sublabel}</p>
      </div>

      {errorMessage && (
        <p className="text-primary text-sm mt-3 text-center font-medium">
          {errorMessage}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 bg-surface border border-muted/20 pl-3 pr-2 py-2 rounded-lg max-w-full shadow-sm"
            >
              <FileIcon className="w-5 h-5 text-primary shrink-0" />
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-sm font-medium text-text truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-muted">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 hover:bg-muted/10 rounded-full transition-colors ml-1 shrink-0"
                aria-label="Remove file"
              >
                <X className="w-4 h-4 text-muted hover:text-primary" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
