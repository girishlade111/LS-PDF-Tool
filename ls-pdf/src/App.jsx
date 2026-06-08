import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FileStoreProvider } from './context/FileStoreContext';
import Layout from './components/common/Layout';

// Placeholder Home content until we build the real pages
function HomePlaceholder() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">LS PDF Setup Complete</h1>
        <div className="bg-primary text-white p-4 rounded-lg">
          Layout and Routing are working perfectly!
        </div>
        <div className="mt-4 p-4 bg-white border border-muted/20 rounded-lg shadow-sm">
          <p className="text-text">
            Header is sticky above. Footer is locked to the bottom. Ready for the real pages!
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <FileStoreProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePlaceholder />} />
          </Routes>
        </Layout>
      </Router>
    </FileStoreProvider>
  );
}

export default App;