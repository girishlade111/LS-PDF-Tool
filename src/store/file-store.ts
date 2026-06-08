import { create } from 'zustand';

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
  pageCount?: number;
  thumbnail?: string; // base64 data URL
}

export type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

export interface ProcessResult {
  blob: Blob;
  filename: string;
  size: number;
}

interface FileStore {
  files: PDFFile[];
  processingState: ProcessingState;
  processingProgress: number;
  processingMessage: string;
  result: ProcessResult | null;
  error: string | null;
  
  addFiles: (files: PDFFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  updateFile: (id: string, updates: Partial<PDFFile>) => void;
  
  setProcessing: (message?: string) => void;
  setProgress: (progress: number, message?: string) => void;
  setSuccess: (result: ProcessResult) => void;
  setError: (error: string) => void;
  resetProcessing: () => void;
  resetAll: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  processingState: 'idle',
  processingProgress: 0,
  processingMessage: '',
  result: null,
  error: null,
  
  addFiles: (newFiles) => set((state) => ({
    files: [...state.files, ...newFiles],
  })),
  
  removeFile: (id) => set((state) => ({
    files: state.files.filter((f) => f.id !== id),
  })),
  
  clearFiles: () => set({ files: [] }),
  
  reorderFiles: (fromIndex, toIndex) => set((state) => {
    const newFiles = [...state.files];
    const [moved] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, moved);
    return { files: newFiles };
  }),
  
  updateFile: (id, updates) => set((state) => ({
    files: state.files.map((f) => f.id === id ? { ...f, ...updates } : f),
  })),
  
  setProcessing: (message = 'Processing...') => set({
    processingState: 'processing',
    processingProgress: 0,
    processingMessage: message,
    result: null,
    error: null,
  }),
  
  setProgress: (progress, message) => set((state) => ({
    processingProgress: progress,
    processingMessage: message || state.processingMessage,
  })),
  
  setSuccess: (result) => set({
    processingState: 'success',
    processingProgress: 100,
    processingMessage: 'Done!',
    result,
    error: null,
  }),
  
  setError: (error) => set({
    processingState: 'error',
    processingMessage: 'Error',
    error,
  }),
  
  resetProcessing: () => set({
    processingState: 'idle',
    processingProgress: 0,
    processingMessage: '',
    result: null,
    error: null,
  }),
  
  resetAll: () => set({
    files: [],
    processingState: 'idle',
    processingProgress: 0,
    processingMessage: '',
    result: null,
    error: null,
  }),
}));
