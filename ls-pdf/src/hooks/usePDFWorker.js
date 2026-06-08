import { useState, useRef, useEffect, useCallback } from 'react';

export default function usePDFWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef(null);

  useEffect(() => {
    // Terminate worker when component using it unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const process = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);
      setProgress(0);

      if (workerRef.current) {
        workerRef.current.terminate();
      }

      // Initialize worker via Vite module import
      workerRef.current = new Worker(new URL('../workers/pdfWorker.js', import.meta.url), { type: 'module' });

      workerRef.current.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'PROGRESS') {
          setProgress(data.progress);
        } else if (data.type === 'DONE') {
          setIsProcessing(false);
          workerRef.current.terminate();
          workerRef.current = null;
          resolve(data.result);
        } else if (data.type === 'ERROR') {
          setIsProcessing(false);
          workerRef.current.terminate();
          workerRef.current = null;
          reject(new Error(data.message));
        }
      };

      workerRef.current.onerror = (err) => {
        setIsProcessing(false);
        workerRef.current.terminate();
        workerRef.current = null;
        reject(err);
      };

      workerRef.current.postMessage({ type, payload });
    });
  }, []);

  return { process, progress, isProcessing };
}
