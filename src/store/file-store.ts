import { create } from 'zustand';
import { addHistoryEntry } from '@/lib/indexeddb';
import { getToolById } from '@/lib/tools';
import { useNavStore } from '@/store/nav-store';

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

function recordHistory(
  files: PDFFile[],
  status: 'success' | 'error',
  result?: ProcessResult
) {
  if (typeof window === 'undefined') return;

  const toolType = useNavStore.getState().currentPage;
  if (toolType === 'home') return;

  const tool = getToolById(toolType);
  const firstFile = files[0];
  const createdAt = Date.now();

  void addHistoryEntry({
    id: `${createdAt}-${Math.random().toString(36).slice(2, 9)}`,
    toolType,
    toolName: tool?.name || toolType,
    inputFiles: files.map((file) => file.name),
    outputFiles: result ? [result.filename] : [],
    filename: result?.filename || firstFile?.name || 'Unknown file',
    fileSize: result?.size || firstFile?.size || 0,
    status,
    createdAt,
  }).catch((error) => {
    console.error('Failed to record history:', error);
  });
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
  
  setSuccess: (result) => set((state) => {
    recordHistory(state.files, 'success', result);

    return {
      processingState: 'success',
      processingProgress: 100,
      processingMessage: 'Done!',
      result,
      error: null,
    };
  }),
  
  setError: (error) => set((state) => {
    recordHistory(state.files, 'error');

    return {
      processingState: 'error',
      processingMessage: 'Error',
      error,
    };
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
