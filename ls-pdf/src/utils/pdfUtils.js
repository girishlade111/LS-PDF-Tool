import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function renderPDFPage(pdfData, pageNum, scale = 1.5) {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

export async function extractTextFromPDF(pdfData) {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

export async function getPDFPageCount(pdfData) {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  return pdf.numPages;
}

export async function getPDFThumbnail(pdfData, pageNum = 1, maxDimension = 200) {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 0.5 });
  const scale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height);
  const scaledViewport = page.getViewport({ scale: viewport.scale * scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.7);
}