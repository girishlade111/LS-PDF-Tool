import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FileStoreProvider } from './context/FileStoreContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import PageLoader from './components/common/PageLoader';

const MergePDF = React.lazy(() => import('./pages/tools/MergePDF'));
const SplitPDF = React.lazy(() => import('./pages/tools/SplitPDF'));
const CompressPDF = React.lazy(() => import('./pages/tools/CompressPDF'));
const RotatePDF = React.lazy(() => import('./pages/tools/RotatePDF'));
const PdfToJpg = React.lazy(() => import('./pages/tools/PdfToJpg'));
const JpgToPdf = React.lazy(() => import('./pages/tools/JpgToPdf'));
const WatermarkPDF = React.lazy(() => import('./pages/tools/WatermarkPDF'));
const ProtectPDF = React.lazy(() => import('./pages/tools/ProtectPDF'));
const OrganizePDF = React.lazy(() => import('./pages/tools/OrganizePDF'));
const PdfToText = React.lazy(() => import('./pages/tools/PdfToText'));

function App() {
  return (
    <FileStoreProvider>
      <Router>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/merge" element={<MergePDF />} />
              <Route path="/split" element={<SplitPDF />} />
              <Route path="/compress" element={<CompressPDF />} />
              <Route path="/rotate" element={<RotatePDF />} />
              <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
              <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
              <Route path="/watermark" element={<WatermarkPDF />} />
              <Route path="/protect" element={<ProtectPDF />} />
              <Route path="/organize" element={<OrganizePDF />} />
              <Route path="/pdf-to-text" element={<PdfToText />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </FileStoreProvider>
  );
}

export default App;