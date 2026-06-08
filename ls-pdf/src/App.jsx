import { FileStoreProvider, useFileStore } from './context/FileStoreContext';

function FileStoreTest() {
  const { state, dispatch } = useFileStore();

  const handleAddFile = () => {
    const file = new File(['test content'], `test-${Date.now()}.pdf`, { type: 'application/pdf' });
    dispatch({ type: 'ADD_INPUT_FILE', payload: file });
  };

  const handleRemoveFile = (index) => {
    dispatch({ type: 'REMOVE_INPUT_FILE', payload: index });
  };

  const handleSetStatus = () => {
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 50 } });
  };

  const handleSetError = () => {
    dispatch({ type: 'SET_ERROR', payload: 'Test error message' });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-muted/20 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Input Files ({state.inputFiles.length})</h3>
        {state.inputFiles.length === 0 ? (
          <p className="text-muted text-sm">No files added</p>
        ) : (
          <ul className="space-y-1">
            {state.inputFiles.map((file, i) => (
              <li key={i} className="flex justify-between text-sm p-2 bg-background rounded border border-muted/20">
                <span>{file.name} ({file.size} bytes)</span>
                <button
                  onClick={() => handleRemoveFile(i)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={handleAddFile}
          className="mt-2 px-3 py-1 text-sm bg-primary text-white rounded hover:opacity-80"
        >
          Add Test File
        </button>
      </div>

      <div className="bg-surface border border-muted/20 rounded-lg p-4">
        <h3 className="font-semibold mb-2">State</h3>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd className="font-mono">
              {state.status}
              {state.progress > 0 && <span className="ml-2">({state.progress}%)</span>}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Error</dt>
            <dd className="font-mono text-red-600">{state.errorMessage || 'none'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Output File</dt>
            <dd className="font-mono">{state.outputFileName || 'none'}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={handleSetStatus} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:opacity-80">
          Set Processing (50%)
        </button>
        <button onClick={handleSetError} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:opacity-80">
          Set Error
        </button>
        <button onClick={handleReset} className="px-3 py-1 text-sm bg-muted text-white rounded hover:opacity-80">
          Reset
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <FileStoreProvider>
      <div className="min-h-screen bg-surface p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-4">LS PDF</h1>
          <div className="bg-primary text-white p-4 rounded-lg mb-6">
            Tailwind CSS is working!
          </div>
          <FileStoreTest />
        </div>
      </div>
    </FileStoreProvider>
  );
}

export default App;