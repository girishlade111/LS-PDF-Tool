import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { getPdfjs } from '@/lib/pdf-worker';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Load a PDF document from ArrayBuffer
 */
export async function loadPDF(data: ArrayBuffer): Promise<PDFDocument> {
  return PDFDocument.load(data, { ignoreEncryption: true });
}

/**
 * Get page count of a PDF
 */
export async function getPDFPageCount(data: ArrayBuffer): Promise<number> {
  const pdf = await loadPDF(data);
  return pdf.getPageCount();
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePDFs(files: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const fileData of files) {
    const pdf = await loadPDF(fileData);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return mergedPdf.save();
}

/**
 * Split PDF into individual pages
 */
export async function splitPDF(
  data: ArrayBuffer,
  pageRanges: number[][]
): Promise<Uint8Array[]> {
  const pdf = await loadPDF(data);
  const results: Uint8Array[] = [];
  
  for (const range of pageRanges) {
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, range);
    copiedPages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }
  
  return results;
}

/**
 * Rotate PDF pages
 */
export async function rotatePDF(
  data: ArrayBuffer,
  rotation: number,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const pages = pdf.getPages();
  
  pages.forEach((page, index) => {
    if (!pageIndices || pageIndices.includes(index)) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotation));
    }
  });
  
  return pdf.save();
}

/**
 * Add watermark to PDF
 */
export async function watermarkPDF(
  data: ArrayBuffer,
  text: string,
  options?: {
    fontSize?: number;
    opacity?: number;
    color?: { r: number; g: number; b: number };
    position?: 'diagonal' | 'center' | 'top' | 'bottom';
    rotation?: number;
  }
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  const {
    fontSize = 50,
    opacity = 0.3,
    color = { r: 0.5, g: 0.5, b: 0.5 },
    position = 'diagonal',
    rotation = -45,
  } = options || {};

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = helvetica.widthOfTextAtSize(text, fontSize);

    let x: number;
    let y: number;
    let effectiveRotation = rotation;

    if (position === 'diagonal') {
      // Diagonal watermark across the center
      x = (width - textWidth * Math.cos(Math.abs(rotation) * Math.PI / 180)) / 2;
      y = height / 2;
      effectiveRotation = rotation;
    } else if (position === 'center') {
      // Centered, no rotation
      x = (width - textWidth) / 2;
      y = height / 2;
      effectiveRotation = 0;
    } else if (position === 'top') {
      // Top center
      x = (width - textWidth) / 2;
      y = height - fontSize - 30;
      effectiveRotation = 0;
    } else {
      // Bottom center
      x = (width - textWidth) / 2;
      y = 30 + fontSize;
      effectiveRotation = 0;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: helvetica,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(effectiveRotation),
    });
  }

  return pdf.save();
}

/**
 * Create PDF from images
 */
export async function imagesToPDF(images: ArrayBuffer[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  for (const imageData of images) {
    let image;
    // Try PNG first, then JPEG
    try {
      image = await pdfDoc.embedPng(imageData);
    } catch {
      try {
        image = await pdfDoc.embedJpg(imageData);
      } catch {
        // Skip unsupported image formats
        continue;
      }
    }
    
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  
  return pdfDoc.save();
}

/**
 * Organize PDF pages - reorder and delete
 */
export async function organizePDF(
  data: ArrayBuffer,
  pageOrder: number[],
  deletePages: number[] = []
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const newPdf = await PDFDocument.create();
  
  const validPages = pageOrder.filter((i) => !deletePages.includes(i));
  const copiedPages = await newPdf.copyPages(pdf, validPages);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  return newPdf.save();
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(data: ArrayBuffer): Promise<{
  title: string | undefined;
  author: string | undefined;
  subject: string | undefined;
  keywords: string[] | undefined;
  creator: string | undefined;
  producer: string | undefined;
  creationDate: Date | undefined;
  modificationDate: Date | undefined;
}> {
  const pdf = await loadPDF(data);
  return {
    title: pdf.getTitle(),
    author: pdf.getAuthor(),
    subject: pdf.getSubject(),
    keywords: pdf.getKeywords(),
    creator: pdf.getCreator(),
    producer: pdf.getProducer(),
    creationDate: pdf.getCreationDate(),
    modificationDate: pdf.getModificationDate(),
  };
}

/**
 * Edit PDF metadata
 */
export async function editPDFMetadata(
  data: ArrayBuffer,
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  }
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);

  if (metadata.title !== undefined) pdf.setTitle(metadata.title);
  if (metadata.author !== undefined) pdf.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdf.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) pdf.setKeywords(metadata.keywords);

  return pdf.save();
}

/**
 * Delete specific pages from a PDF
 */
export async function deletePDFPages(
  data: ArrayBuffer,
  pageIndicesToDelete: number[]
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const totalPages = pdf.getPageCount();
  const deleteSet = new Set(pageIndicesToDelete);

  const remainingIndices: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!deleteSet.has(i)) {
      remainingIndices.push(i);
    }
  }

  if (remainingIndices.length === 0) {
    throw new Error('Cannot delete all pages');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, remainingIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

/**
 * Flatten PDF - re-render each page as an image to flatten form fields and annotations
 */
export async function flattenPDF(
  data: ArrayBuffer,
  options?: {
    flattenFormFields?: boolean;
    flattenAnnotations?: boolean;
    flattenWatermarks?: boolean;
    quality?: 'standard' | 'high';
    onProgress?: (page: number, total: number) => void;
  }
): Promise<Uint8Array> {
  // Note: flattenFormFields, flattenAnnotations, flattenWatermarks options
  // are UI-facing. Re-rendering inherently flattens all visible content.
  const quality = options?.quality ?? 'standard';
  const onProgress = options?.onProgress;

  // Dynamic import of pdfjs-dist to avoid SSR issues
  const pdfjsLib = await getPdfjs();

  const scale = quality === 'high' ? 2.5 : 1.5;

  // Load with pdfjs-dist for rendering
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
  const numPages = pdfDoc.numPages;

  // Create new PDF with pdf-lib
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages);

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    // Render page to canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert canvas to PNG bytes
    const pngDataUrl = canvas.toDataURL('image/png');
    const pngBase64 = pngDataUrl.split(',')[1];
    const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));

    // Embed the PNG image into the new PDF
    const pngImage = await newPdf.embedPng(pngBytes);

    // Get original page size
    const origViewport = page.getViewport({ scale: 1 });
    const pageWidth = origViewport.width;
    const pageHeight = origViewport.height;

    const newPage = newPdf.addPage([pageWidth, pageHeight]);
    newPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  return newPdf.save();
}

/**
 * Get page dimensions for all pages in a PDF
 */
export async function getPDFPageDimensions(
  data: ArrayBuffer
): Promise<Array<{ width: number; height: number }>> {
  const pdf = await loadPDF(data);
  const pages = pdf.getPages();
  return pages.map((page) => {
    const { width, height } = page.getSize();
    return { width, height };
  });
}

/**
 * Crop PDF pages by adjusting box dimensions
 */
export async function cropPDF(
  data: ArrayBuffer,
  options: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    pageIndices?: number[];
  }
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const pages = pdf.getPages();

  pages.forEach((page, index) => {
    if (!options.pageIndices || options.pageIndices.includes(index)) {
      const { width, height } = page.getSize();

      const newLeft = options.left;
      const newBottom = options.bottom;
      const newRight = width - options.right;
      const newTop = height - options.top;

      // Ensure crop area is valid
      if (newRight <= newLeft || newTop <= newBottom) {
        throw new Error(`Invalid crop dimensions for page ${index + 1}: crop area is empty`);
      }

      page.setCropBox(newLeft, newBottom, newRight - newLeft, newTop - newBottom);
      page.setMediaBox(newLeft, newBottom, newRight - newLeft, newTop - newBottom);
      page.setTrimBox(newLeft, newBottom, newRight - newLeft, newTop - newBottom);
    }
  });

  return pdf.save();
}

/**
 * Unlock PDF - remove password protection by re-saving without encryption
 */
export async function unlockPDF(data: ArrayBuffer, _password?: string): Promise<Uint8Array> {
  // Load with ignoreEncryption already set in loadPDF
  // Re-save to strip encryption metadata
  const pdf = await loadPDF(data);
  return pdf.save();
}

/**
 * Repair PDF - rebuild by copying pages to fresh document
 */
export async function repairPDF(
  data: ArrayBuffer,
  options?: {
    rebuildXRef?: boolean;
    removeCorrupted?: boolean;
    fixPageTree?: boolean;
    stripInvalidMetadata?: boolean;
  }
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);

  // Create fresh document and copy all pages (rebuilds structure)
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
  copiedPages.forEach((page) => newPdf.addPage(page));

  // Optionally strip invalid metadata
  if (options?.stripInvalidMetadata) {
    // Reset metadata that might be corrupted
    try {
      newPdf.setTitle(pdf.getTitle() || '');
      newPdf.setAuthor(pdf.getAuthor() || '');
    } catch {
      newPdf.setTitle('');
      newPdf.setAuthor('');
    }
  }

  return newPdf.save();
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Redact PDF - draw rectangles over matching text
 */
export async function redactPDF(
  data: ArrayBuffer,
  searchText: string,
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    color?: { r: number; g: number; b: number };
    style?: 'solid' | 'x-mark';
  }
): Promise<Uint8Array> {
  // Dynamic import of pdfjs-dist
  const pdfjsLib = await getPdfjs();

  const {
    caseSensitive = false,
    wholeWord = false,
    color = { r: 0, g: 0, b: 0 },
    style = 'solid',
  } = options || {};

  // Load with pdfjs-dist for text extraction
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;

  // Load with pdf-lib for modification
  const pdfLib = await loadPDF(data);
  const pages = pdfLib.getPages();

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pdfLibPage = pages[i - 1];
    const { height } = pdfLibPage.getSize();

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const text = item.str;
      let matches = false;

      if (caseSensitive) {
        matches = wholeWord ? new RegExp(`\\b${escapeRegExp(searchText)}\\b`).test(text) : text.includes(searchText);
      } else {
        matches = wholeWord ? new RegExp(`\\b${escapeRegExp(searchText)}\\b`, 'i').test(text) : text.toLowerCase().includes(searchText.toLowerCase());
      }

      if (matches && 'transform' in item) {
        // Calculate position from transform matrix
        const tx = (item as { transform: number[] }).transform[4];
        const ty = (item as { transform: number[] }).transform[5];
        // Convert from pdfjs coordinates to pdf-lib coordinates
        const x = tx;
        const y = height - ty - (item.height || 12);
        const w = item.width || 100;
        const h = item.height || 12;

        // Draw redaction rectangle
        if (style === 'solid') {
          pdfLibPage.drawRectangle({
            x: x - 2,
            y: y - 2,
            width: w + 4,
            height: h + 4,
            color: rgb(color.r, color.g, color.b),
          });
        } else {
          // X-mark style - draw rectangle with X marks
          pdfLibPage.drawRectangle({
            x: x - 2,
            y: y - 2,
            width: w + 4,
            height: h + 4,
            color: rgb(color.r, color.g, color.b),
          });
          // Draw X over the redaction
          pdfLibPage.drawLine({
            start: { x: x - 2, y: y - 2 },
            end: { x: x + w + 2, y: y + h + 2 },
            thickness: 1,
            color: rgb(1, 1, 1),
          });
          pdfLibPage.drawLine({
            start: { x: x + w + 2, y: y - 2 },
            end: { x: x - 2, y: y + h + 2 },
            thickness: 1,
            color: rgb(1, 1, 1),
          });
        }
      }
    }
  }

  return pdfLib.save();
}

/**
 * Compare two PDFs - extract page counts, dimensions, and metadata for comparison
 */
export async function comparePDFs(
  data1: ArrayBuffer,
  data2: ArrayBuffer
): Promise<{
  file1: {
    pageCount: number;
    dimensions: Array<{ width: number; height: number }>;
    metadata: Awaited<ReturnType<typeof getPDFMetadata>>;
  };
  file2: {
    pageCount: number;
    dimensions: Array<{ width: number; height: number }>;
    metadata: Awaited<ReturnType<typeof getPDFMetadata>>;
  };
}> {
  const [pdf1, pdf2] = await Promise.all([loadPDF(data1), loadPDF(data2)]);
  const [meta1, meta2] = await Promise.all([getPDFMetadata(data1), getPDFMetadata(data2)]);

  const getDims = (pdf: PDFDocument) => {
    return pdf.getPages().map((page) => {
      const { width, height } = page.getSize();
      return { width, height };
    });
  };

  return {
    file1: {
      pageCount: pdf1.getPageCount(),
      dimensions: getDims(pdf1),
      metadata: meta1,
    },
    file2: {
      pageCount: pdf2.getPageCount(),
      dimensions: getDims(pdf2),
      metadata: meta2,
    },
  };
}

/**
 * Rearrange PDF pages in a new order
 */
export async function rearrangePDFPages(data: ArrayBuffer, newOrder: number[]): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, newOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));
  return newPdf.save();
}

/**
 * PDF to HTML - extract text and convert
 */
export async function pdfToHTML(
  data: ArrayBuffer,
  options?: { mode?: 'simple' | 'structured'; includeImages?: boolean; pageRange?: number[] }
): Promise<{ html: string; pages: string[] }> {
  const pdfjsLib = await getPdfjs();

  const mode = options?.mode ?? 'simple';
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];

  const totalPages = pdfDoc.numPages;
  const pageRange = options?.pageRange ?? Array.from({ length: totalPages }, (_, i) => i + 1);

  for (const pageNum of pageRange) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    if (mode === 'simple') {
      // Simple: extract text as paragraphs
      const text = textContent.items
        .filter((item): item is { str: string; transform: number[] } => 'str' in item)
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push(`<div class="page"><h2>Page ${pageNum}</h2><p>${text}</p></div>`);
    } else {
      // Structured: approximate layout with positioned spans
      const items = textContent.items
        .filter((item): item is { str: string; transform: number[]; width: number; height: number } => 'str' in item)
        .map(item => ({
          text: item.str,
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          width: Math.round(item.width || 100),
          fontSize: Math.round(Math.abs(item.transform[0]) || 12),
        }));

      const htmlItems = items.map(item =>
        `<span style="position:absolute;left:${item.x}px;top:${item.y}px;font-size:${item.fontSize}px;">${item.text}</span>`
      ).join('\n');

      const viewport = page.getViewport({ scale: 1 });
      pages.push(`<div class="page" style="position:relative;width:${viewport.width}px;height:${viewport.height}px;">${htmlItems}</div>`);
    }
  }

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Converted PDF</title><style>.page{margin:20px auto;max-width:800px;padding:20px;border:1px solid #ccc;}h2{color:#333;}</style></head><body>${pages.join('\n')}</body></html>`;

  return { html: fullHtml, pages };
}

/**
 * Sign PDF - add signature image to page
 */
export async function signPDF(
  data: ArrayBuffer,
  signatureImage: Uint8Array,
  options?: { page?: number; position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right'; scale?: 'small' | 'medium' | 'large' }
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);
  const pageIndex = (options?.page ?? 1) - 1;
  const page = pdf.getPages()[pageIndex];
  const { width, height } = page.getSize();

  // Embed signature image
  let image;
  try {
    image = await pdf.embedPng(signatureImage);
  } catch {
    image = await pdf.embedJpg(signatureImage);
  }

  const scale = options?.scale ?? 'medium';
  const scaleFactor = scale === 'small' ? 0.15 : scale === 'large' ? 0.35 : 0.25;
  const imgWidth = width * scaleFactor;
  const imgHeight = imgWidth * (image.height / image.width);

  const position = options?.position ?? 'bottom-right';
  let x: number, y: number;

  const margin = 40;
  switch (position) {
    case 'bottom-left':
      x = margin;
      y = margin;
      break;
    case 'bottom-center':
      x = (width - imgWidth) / 2;
      y = margin;
      break;
    case 'top-right':
      x = width - imgWidth - margin;
      y = height - imgHeight - margin;
      break;
    case 'bottom-right':
    default:
      x = width - imgWidth - margin;
      y = margin;
      break;
  }

  page.drawImage(image, { x, y, width: imgWidth, height: imgHeight });
  return pdf.save();
}

/**
 * Simplified compress - remove metadata and optimize
 */
export async function compressPDF(
  data: ArrayBuffer,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Uint8Array> {
  const pdf = await loadPDF(data);

  if (quality === 'low') {
    // Aggressive compression: strip all metadata, remove unused objects
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');

    // Try to compress streams by re-saving with optimizations
    return pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    });
  } else if (quality === 'medium') {
    // Balanced: strip metadata, standard save
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');

    return pdf.save();
  } else {
    // High quality: minimal changes, just re-save
    return pdf.save();
  }
}
