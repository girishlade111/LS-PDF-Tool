import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  inputFiles: [],          // Array of File objects
  outputFile: null,        // Blob or null
  outputFileName: '',      // string
  status: 'idle',          // 'idle' | 'processing' | 'done' | 'error'
  progress: 0,             // 0-100
  errorMessage: '',
};

function fileStoreReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT_FILES':
      return { ...state, inputFiles: action.payload };
    case 'ADD_INPUT_FILE':
      return { ...state, inputFiles: [...state.inputFiles, action.payload] };
    case 'REMOVE_INPUT_FILE':
      return {
        ...state,
        inputFiles: state.inputFiles.filter((_, index) => index !== action.payload),
      };
    case 'REORDER_INPUT_FILES': {
      const { fromIndex, toIndex } = action.payload;
      const result = Array.from(state.inputFiles);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return { ...state, inputFiles: result };
    }
    case 'SET_OUTPUT':
      return {
        ...state,
        outputFile: action.payload.file,
        outputFileName: action.payload.fileName,
      };
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload.status,
        progress: action.payload.progress !== undefined ? action.payload.progress : state.progress,
      };
    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const FileStoreContext = createContext(null);

export function FileStoreProvider({ children }) {
  const [state, dispatch] = useReducer(fileStoreReducer, initialState);

  return (
    <FileStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </FileStoreContext.Provider>
  );
}

export function useFileStore() {
  const context = useContext(FileStoreContext);
  if (!context) {
    throw new Error('useFileStore must be used within a FileStoreProvider');
  }
  return context;
}
