import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FileStoreProvider } from './context/FileStoreContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';

function App() {
  return (
    <FileStoreProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Layout>
      </Router>
    </FileStoreProvider>
  );
}

export default App;