import { useState, useEffect, useRef } from 'react';
import { pdfjsLib } from '../utils/pdfUtils';

export const renderPageThumbnail = async (pdf, pageNum, scale = 0.25) => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d');
  
  // Ensure white background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  await page.render({ canvasContext: context, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  page.cleanup();
  return dataUrl;
};

export default function usePDFThumbnails(file, { scale = 0.25, maxPages = 50 } = {}) {
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  
  const pdfRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setTotalPages(0);
      setIsLoading(false);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);
    setThumbnails([]);
    
    let pdfDoc = null;

    const processPDF = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (cancelRef.current) return;
        
        pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        pdfRef.current = pdfDoc;
        
        if (cancelRef.current) return;
        
        const numPages = pdfDoc.numPages;
        setTotalPages(numPages);
        
        const pagesToRender = Math.min(numPages, maxPages);
        
        for (let i = 1; i <= pagesToRender; i++) {
          if (cancelRef.current) break;
          const dataUrl = await renderPageThumbnail(pdfDoc, i, scale);
          if (cancelRef.current) break;
          
          setThumbnails(prev => {
            const next = [...prev];
            next[i - 1] = dataUrl;
            return next;
          });
        }
      } catch (err) {
        if (!cancelRef.current) setError(err.message || 'Error loading thumbnails');
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    processPDF();

    return () => {
      cancelRef.current = true;
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [file, scale, maxPages]);

  const loadMore = async (count = 50) => {
    if (!pdfRef.current || isLoading) return;
    const currentCount = thumbnails.length;
    if (currentCount >= totalPages) return;
    
    setIsLoading(true);
    cancelRef.current = false;
    
    const pagesToRender = Math.min(totalPages, currentCount + count);
    
    try {
      for (let i = currentCount + 1; i <= pagesToRender; i++) {
        if (cancelRef.current) break;
        const dataUrl = await renderPageThumbnail(pdfRef.current, i, scale);
        if (cancelRef.current) break;
        setThumbnails(prev => {
          const next = [...prev];
          next[i - 1] = dataUrl;
          return next;
        });
      }
    } catch(err) {
      if (!cancelRef.current) setError(err.message);
    } finally {
      if (!cancelRef.current) setIsLoading(false);
    }
  };

  return { thumbnails, isLoading, error, totalPages, loadMore };
}
