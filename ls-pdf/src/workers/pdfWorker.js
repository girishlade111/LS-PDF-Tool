import { PDFDocument, degrees } from 'pdf-lib';

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  try {
    if (type === 'MERGE') {
      const { filesData } = payload;
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < filesData.length; i++) {
        const arrayBuffer = filesData[i];
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));

        // Send progress update back to main thread
        const progress = Math.round(((i + 1) / filesData.length) * 100);
        self.postMessage({ type: 'PROGRESS', progress });
      }

      const mergedBytes = await mergedPdf.save();
      self.postMessage({ type: 'DONE', result: mergedBytes });

    } else if (type === 'COMPRESS') {
      const { fileData, level } = payload;
      
      self.postMessage({ type: 'PROGRESS', progress: 30 });

      const pdfDoc = await PDFDocument.load(fileData, { 
        updateMetadata: level === 'high' ? false : true 
      });

      self.postMessage({ type: 'PROGRESS', progress: 60 });

      if (level === 'high') {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
      }

      const useObjectStreams = level !== 'low';
      
      const compressedBytes = await pdfDoc.save({ 
        useObjectStreams, 
        addDefaultPage: false 
      });

      self.postMessage({ type: 'PROGRESS', progress: 90 });
      self.postMessage({ type: 'DONE', result: compressedBytes });

    } else if (type === 'ROTATE') {
      const { fileData, rotations } = payload;

      const pdfDoc = await PDFDocument.load(fileData);
      const pages = pdfDoc.getPages();

      for(let i = 0; i < pages.length; i++) {
        const currentRotation = pages[i].getRotation().angle;
        const additionalRotation = rotations[i] || 0;
        
        pages[i].setRotation(degrees(currentRotation + additionalRotation));

        if (i % 5 === 0 || i === pages.length - 1) {
          const progress = Math.round(((i + 1) / pages.length) * 100);
          self.postMessage({ type: 'PROGRESS', progress });
        }
      }

      const rotatedBytes = await pdfDoc.save();
      self.postMessage({ type: 'DONE', result: rotatedBytes });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', message: error.message });
  }
};
