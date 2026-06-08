import { createContext, useContext, useReducer, useMemo } from 'react';

const initialState = {
  inputFiles: [],
  outputFile: null,
  outputFileName: '',
  status: 'idle',
  progress: 0,
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
        inputFiles: state.inputFiles.filter((_, i) => i !== action.payload),
      };

    case 'REORDER_INPUT_FILES': {
      const { fromIndex, toIndex } = action.payload;
      const newFiles = [...state.inputFiles];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return { ...state, inputFiles: newFiles };
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
        progress: action.payload.progress ?? state.progress,
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

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <FileStoreContext.Provider value={value}>
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