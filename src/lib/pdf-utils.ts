import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

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
