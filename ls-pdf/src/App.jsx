import { FileStoreProvider } from './context/FileStoreContext';

function App() {
  return (
    <FileStoreProvider>
      <div className="min-h-screen bg-surface p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-4">LS PDF</h1>
          <div className="bg-primary text-white p-4 rounded-lg">
            Tailwind CSS is working!
          </div>
          <div className="mt-4 p-4 bg-surface border border-muted/20 rounded-lg">
            <p className="text-text">All dependencies installed and configured.</p>
          </div>
        </div>
      </div>
    </FileStoreProvider>
  );
}

export default App;