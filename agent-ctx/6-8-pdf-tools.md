# Agent Context: pdf-tools

## Task ID: 6-8
## Task: Build all 10 PDF tool components

### Completed
All 10 PDF tool components have been created in `/home/z/my-project/src/tools/`:

1. **merge-pdf.tsx** - Merge multiple PDFs into one. Uses `mergePDFs` from pdf-utils. Supports up to 20 files.
2. **split-pdf.tsx** - Split PDF by page ranges, each page, or chunks. Uses `splitPDF` from pdf-utils and JSZip for multi-file packaging.
3. **compress-pdf.tsx** - Compress PDF to reduce file size. Uses `compressPDF` from pdf-utils.
4. **rotate-pdf.tsx** - Rotate PDF pages by 90°, 180°, or 270°. Uses `rotatePDF` from pdf-utils.
5. **pdf-to-jpg.tsx** - Convert PDF pages to JPG images. Uses pdfjs-dist for rendering and JSZip for packaging.
6. **jpg-to-pdf.tsx** - Convert images (JPG/PNG) to PDF. Uses `imagesToPDF` from pdf-utils. Supports up to 50 images.
7. **watermark-pdf.tsx** - Add text watermark to PDF with configurable font size and opacity. Uses `watermarkPDF` from pdf-utils.
8. **protect-pdf.tsx** - Protect PDF with password (re-saves with metadata protection). Uses `loadPDF` from pdf-utils.
9. **organize-pdf.tsx** - Reorder and delete PDF pages. Uses `organizePDF` from pdf-utils with interactive page management.
10. **pdf-to-text.tsx** - Extract text from PDF. Uses pdfjs-dist for text extraction with copy/download options.

### Dependencies
All tools depend on:
- `@/components/shared/tool-page` - ToolPage wrapper component
- `@/store/file-store` - useFileStore hook for file/processing state
- `@/lib/pdf-utils` - PDF utility functions
- Various shadcn/ui components (Button, Input, Label, Slider, Textarea)
- lucide-react icons
- JSZip (for split-pdf and pdf-to-jpg)
- pdfjs-dist (for pdf-to-jpg and pdf-to-text)
