import { FileStoreProvider } from './context/FileStoreContext';
import FileDropzone from './components/common/FileDropzone';
import { useState } from 'react';

function FileDropzoneTest() {
  const [files, setFiles] = useState([]);
  const [multipleFiles, setMultipleFiles] = useState([]);

  return (
    <div className="space-y-8">
      <div className="bg-surface border border-muted/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Single PDF Upload</h3>
        <FileDropzone
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          onFilesAccepted={setFiles}
          label="Drop a PDF file here"
          sublabel="or click to browse (max 1 file)"
        />
        <div className="mt-4 p-3 bg-background rounded text-sm">
          <strong>Selected: </strong>
          {files.map((f, i) => (
            <span key={i} className="font-mono">{f.name} ({f.size} bytes)</span>
          ))}
          {files.length === 0 && <span className="text-muted">None</span>}
        </div>
      </div>

      <div className="bg-surface border border-muted/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Multiple PDF Upload</h3>
        <FileDropzone
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={true}
          onFilesAccepted={setMultipleFiles}
          label="Drop multiple PDF files here"
          sublabel="or click to browse"
        />
        <div className="mt-4 p-3 bg-background rounded text-sm">
          <strong>Selected ({multipleFiles.length}): </strong>
          {multipleFiles.map((f, i) => (
            <span key={i} className="block font-mono">{f.name} ({f.size} bytes)</span>
          ))}
          {multipleFiles.length === 0 && <span className="text-muted">None</span>}
        </div>
      </div>

      <div className="bg-surface border border-muted/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Error Test (accepts only images)</h3>
        <FileDropzone
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
          multiple={false}
          onFilesAccepted={(f) => console.log('Images:', f)}
          label="Drop an image file here"
          sublabel="Try dropping a PDF to see error"
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
          <FileDropzoneTest />
        </div>
      </div>
    </FileStoreProvider>
  );
}

export default App;