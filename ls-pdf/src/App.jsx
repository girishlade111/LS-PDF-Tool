import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FileStoreProvider } from './context/FileStoreContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import PageLoader from './components/common/PageLoader';
import NotFound from './pages/NotFound';

const MergePDF = React.lazy(() => import('./pages/tools/MergePDF'));
const SplitPDF = React.lazy(() => import('./pages/tools/SplitPDF'));
const CompressPDF = React.lazy(() => import('./pages/tools/CompressPDF'));
const RotatePDF = React.lazy(() => import('./pages/tools/RotatePDF'));
const PDFtoJPG = React.lazy(() => import('./pages/tools/PDFtoJPG'));
const JPGtoPDF = React.lazy(() => import('./pages/tools/JPGtoPDF'));
const WatermarkPDF = React.lazy(() => import('./pages/tools/WatermarkPDF'));
const ProtectPDF = React.lazy(() => import('./pages/tools/ProtectPDF'));
const OrganizePDF = React.lazy(() => import('./pages/tools/OrganizePDF'));
const PDFtoText = React.lazy(() => import('./pages/tools/PDFtoText'));

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
              <Route path="/pdf-to-jpg" element={<PDFtoJPG />} />
              <Route path="/jpg-to-pdf" element={<JPGtoPDF />} />
              <Route path="/watermark" element={<WatermarkPDF />} />
              <Route path="/protect" element={<ProtectPDF />} />
              <Route path="/organize" element={<OrganizePDF />} />
              <Route path="/pdf-to-text" element={<PDFtoText />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </FileStoreProvider>
  );
}

export default App;