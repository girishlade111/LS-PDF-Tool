import { useEffect, useState } from 'react';
import { initDB, addHistoryEntry, getHistory, clearHistory, DB_NAME, STORE_NAME } from './utils/indexedDBUtils';

function App() {
  const [history, setHistory] = useState([]);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function testDB() {
      await initDB();
      setDbReady(true);
      await testHistory();
    }
    testDB();
  }, []);

  async function testHistory() {
    await addHistoryEntry({ toolName: 'Merge', fileName: 'test1.pdf', fileSize: 1024, status: 'success' });
    await addHistoryEntry({ toolName: 'Split', fileName: 'test2.pdf', fileSize: 2048, status: 'success' });
    await addHistoryEntry({ toolName: 'Rotate', fileName: 'test3.pdf', fileSize: 512, status: 'success' });
    await addHistoryEntry({ toolName: 'Watermark', fileName: 'test4.pdf', fileSize: 4096, status: 'success' });
    await addHistoryEntry({ toolName: 'Protect', fileName: 'test5.pdf', fileSize: 3072, status: 'success' });
    await addHistoryEntry({ toolName: 'Compress', fileName: 'test6.pdf', fileSize: 8192, status: 'success' });

    const entries = await getHistory();
    setHistory(entries);
    console.log('History (should be 5 entries, newest first):', entries);
    console.log('DB_NAME:', DB_NAME, 'STORE_NAME:', STORE_NAME);
  }

  async function handleClear() {
    await clearHistory();
    const entries = await getHistory();
    setHistory(entries);
  }

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">LS PDF</h1>
        <div className="bg-primary text-white p-4 rounded-lg mb-4">
          Tailwind CSS is working!
        </div>

        <div className="mb-4 p-4 bg-surface border border-muted/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">IndexedDB Test</h2>
          <p className="text-text mb-2">DB: {dbReady ? 'Ready' : 'Initializing...'}</p>
          <p className="text-text">DB_NAME: {DB_NAME} | STORE_NAME: {STORE_NAME}</p>
          <button
            onClick={handleClear}
            className="mt-2 px-4 py-2 bg-muted text-white rounded hover:opacity-80"
            disabled={!dbReady}
          >
            Clear History
          </button>
        </div>

        <div className="p-4 bg-surface border border-muted/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Recent Operations (max 5)</h2>
          {history.length === 0 ? (
            <p className="text-muted">No history yet</p>
          ) : (
            <ul className="space-y-2">
              {history.map((entry) => (
                <li key={entry.id} className="flex justify-between text-sm p-2 bg-background rounded border border-muted/20">
                  <span>{entry.toolName} - {entry.fileName} ({entry.fileSize} bytes)</span>
                  <span className={entry.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {entry.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;