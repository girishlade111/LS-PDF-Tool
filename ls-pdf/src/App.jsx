import { FileStoreProvider } from './context/FileStoreContext';
import { useState } from 'react';
import ProcessingStatus from './components/common/ProcessingStatus';
import DownloadResult from './components/common/DownloadResult';

function ProcessingStatusTest() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, processing, done
  const [outputFile, setOutputFile] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');

  const startProcessing = () => {
    setStatus('processing');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus('done');
          const blob = new Blob(['test pdf content'], { type: 'application/pdf' });
          setOutputFile(blob);
          setOutputFileName('merged-document.pdf');
          return 100;
        }
        return p + 10;
      });
    }, 300);
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
    setOutputFile(null);
    setOutputFileName('');
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface border border-muted/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">ProcessingStatus Component</h3>
        {status === 'idle' && (
          <button onClick={startProcessing} className="px-4 py-2 bg-primary text-white rounded hover:opacity-80">
            Start Processing (Demo)
          </button>
        )}
        {status === 'processing' && (
          <ProcessingStatus progress={progress} message="Merging PDF pages…" />
        )}
        {status === 'done' && (
          <DownloadResult
            outputFile={outputFile}
            outputFileName={outputFileName}
            onReset={handleReset}
            toolName="Merged"
          />
        )}
      </div>

      <div className="bg-surface border border-muted/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">DownloadResult - Static Demo</h3>
        <DownloadResult
          outputFile={new Blob(['static test'], { type: 'application/pdf' })}
          outputFileName="test-output.pdf"
          onReset={() => console.log('reset')}
          toolName="Split"
        />
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
          <ProcessingStatusTest />
        </div>
      </div>
    </FileStoreProvider>
  );
}

export default App;