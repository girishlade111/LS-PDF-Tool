import React, { useState, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { LayoutGrid, File as FileIcon, X, AlertCircle, ArrowLeft, ArrowRight, RotateCcw, Trash2, CheckSquare, Square } from 'lucide-react';
import { pdfjsLib } from '../../utils/pdfUtils';
import ToolPageLayout from '../../components/common/ToolPageLayout';
import FileDropzone from '../../components/common/FileDropzone';
import ProcessingStatus from '../../components/common/ProcessingStatus';
import DownloadResult from '../../components/common/DownloadResult';
import PDFThumbnail from '../../components/common/PDFThumbnail';
import usePDFThumbnails from '../../hooks/usePDFThumbnails';
import { useFileStore } from '../../context/FileStoreContext';
import { addHistoryEntry } from '../../utils/indexedDBUtils';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function OrganizePDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [pdfDocProxy, setPdfDocProxy] = useState(null);
  
  // Array of { id, originalIndex, deleted, selected }
  const [pages, setPages] = useState([]); 
  const [deletedHistory, setDeletedHistory] = useState([]); // Stack of deleted IDs
  const [selectionMode, setSelectionMode] = useState(false);

  // Use the new shared thumbnail hook
  const { thumbnails, totalPages } = usePDFThumbnails(inputFiles[0], { scale: 0.25, maxPages: 50 });

  useEffect(() => {
    return () => {
      if (pdfDocProxy) pdfDocProxy.destroy();
    };
  }, [pdfDocProxy]);

  const handleFilesAccepted = async (files) => {
    if (files.length === 0) return;
    dispatch({ type: 'SET_INPUT_FILES', payload: [files[0]] });
    dispatch({ type: 'SET_ERROR', payload: '' });
    
    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setPdfDocProxy(pdf);
      
      const initialPages = Array.from({ length: pdf.numPages }, (_, i) => ({
        id: `page-${i}-${Date.now()}`,
        originalIndex: i,
        deleted: false,
        selected: false
      }));
      setPages(initialPages);
      setDeletedHistory([]);
      setSelectionMode(false);

    } catch (error) {
      console.error("Error reading PDF:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Could not read PDF. It might be corrupted or protected.' });
      setPages([]);
    }
  };

  const removeFile = () => {
    dispatch({ type: 'SET_INPUT_FILES', payload: [] });
    if (pdfDocProxy) {
      pdfDocProxy.destroy();
      setPdfDocProxy(null);
    }
    setPages([]);
    setDeletedHistory([]);
    setSelectionMode(false);
  };

  // Reorder
  const moveLeft = useCallback((index) => {
    setPages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  }, []);

  const moveRight = useCallback((index) => {
    setPages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  }, []);

  // Delete & Selection
  const toggleSelect = useCallback((id) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  }, []);

  const handleDelete = useCallback((id) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, deleted: true, selected: false } : p));
    setDeletedHistory(prev => [...prev, id]);
  }, []);

  const handleDeleteSelected = () => {
    const selectedIds = pages.filter(p => p.selected && !p.deleted).map(p => p.id);
    if (selectedIds.length === 0) return;
    
    setPages(prev => prev.map(p => p.selected ? { ...p, deleted: true, selected: false } : p));
    setDeletedHistory(prev => [...prev, ...selectedIds]);
    setSelectionMode(false); // turn off mode after batch delete
  };

  const undoDelete = () => {
    if (deletedHistory.length === 0) return;
    const lastDeletedId = deletedHistory[deletedHistory.length - 1];
    setPages(prev => prev.map(p => p.id === lastDeletedId ? { ...p, deleted: false } : p));
    setDeletedHistory(prev => prev.slice(0, -1));
  };

  const restoreAll = () => {
    setPages(prev => prev.map(p => ({ ...p, deleted: false, selected: false })));
    setDeletedHistory([]);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Clear selections when exiting mode
      setPages(prev => prev.map(p => ({ ...p, selected: false })));
    }
  };

  const handleSave = async () => {
    const pagesToKeep = pages.filter(p => !p.deleted);
    if (inputFiles.length === 0 || pagesToKeep.length === 0) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      
      const newPdf = await PDFDocument.create();
      const indicesToKeep = pagesToKeep.map(p => p.originalIndex);

      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 50 } });

      const copiedPages = await newPdf.copyPages(sourcePdf, indicesToKeep);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const outName = 'organized.pdf';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'Organize PDF',
        fileName: file.name,
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Organize error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to organize PDF. ' + (error.message || 'The file might be corrupted or protected.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    if (pdfDocProxy) {
      pdfDocProxy.destroy();
      setPdfDocProxy(null);
    }
    setPages([]);
    setDeletedHistory([]);
    setSelectionMode(false);
  };

  const keptCount = pages.filter(p => !p.deleted).length;
  const totalCount = pages.length;

  return (
    <ToolPageLayout
      toolName="Organize PDF"
      description="Sort, add, and delete PDF pages. Reorder them by clicking the arrows or delete pages you don't need."
      icon={<LayoutGrid className="w-8 h-8" />}
      iconColor="text-teal-500"
      iconBg="bg-teal-50"
    >
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-6">
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {inputFiles.length === 0 ? (
            <FileDropzone 
              accept={{ 'application/pdf': ['.pdf'] }} 
              multiple={false} 
              onFilesAccepted={handleFilesAccepted}
            />
          ) : (
            <div className="space-y-6">
              
              {/* Selected File Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-muted/20 rounded-lg bg-surface gap-4">
                <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                  <FileIcon className="text-primary w-6 h-6 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text truncate max-w-[200px] sm:max-w-xs">{inputFiles[0].name}</span>
                    <span className="text-xs text-muted">{formatFileSize(inputFiles[0].size)} • {totalCount} pages</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                  <span className="text-sm font-bold text-text bg-white px-3 py-1.5 rounded-md border border-muted/20 shadow-sm">
                    {keptCount} of {totalCount} <span className="font-medium text-muted">included</span>
                  </span>
                  <button 
                    onClick={removeFile}
                    className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              {totalPages > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-muted/20 rounded-lg shadow-sm">
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectionMode}
                      className={`px-3 py-1.5 text-sm font-semibold rounded transition-colors flex items-center gap-2 ${
                        selectionMode ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface text-text hover:bg-muted/10 border border-transparent'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Select Multiple
                    </button>
                    
                    {selectionMode && (
                      <button
                        onClick={handleDeleteSelected}
                        disabled={pages.filter(p => p.selected && !p.deleted).length === 0}
                        className="px-3 py-1.5 text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={undoDelete}
                      disabled={deletedHistory.length === 0}
                      className="px-3 py-1.5 text-sm font-semibold text-text bg-surface hover:bg-muted/10 rounded transition-colors disabled:opacity-30 flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Undo Delete
                    </button>
                    <div className="w-px h-5 bg-muted/20"></div>
                    <button
                      onClick={restoreAll}
                      disabled={deletedHistory.length === 0}
                      className="px-3 py-1.5 text-sm font-semibold text-text bg-surface hover:bg-muted/10 rounded transition-colors disabled:opacity-30"
                    >
                      Restore All
                    </button>
                  </div>
                </div>
              )}

              {/* Thumbnails Grid */}
              {totalPages > 0 && (
                <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 sm:p-6 max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pages.map((item, idx) => {
                      const isDeleted = item.deleted;
                      const isSelected = item.selected;
                      
                      const deletedOverlay = isDeleted ? (
                        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm font-bold tracking-wide">
                            Deleted
                          </span>
                        </div>
                      ) : null;

                      const actionOverlay = !isDeleted ? (
                        <div className="absolute top-1 right-1 z-20">
                          {selectionMode ? (
                            <div className="bg-white rounded-md shadow-sm">
                              {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted/50" />}
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                              className="bg-white border border-red-200 text-red-500 hover:text-white hover:bg-red-500 rounded p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                              title="Delete Page"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : null;

                      return (
                        <PDFThumbnail 
                          key={item.id}
                          src={thumbnails[item.originalIndex]}
                          badgeText={idx + 1}
                          isSelected={isSelected}
                          onClick={() => selectionMode && !isDeleted && toggleSelect(item.id)}
                          className={`group ${selectionMode && !isDeleted ? 'cursor-pointer' : ''} ${isDeleted ? 'opacity-70 grayscale border-red-200' : ''}`}
                          imageOverlay={<>{deletedOverlay}{actionOverlay}</>}
                        >
                          {/* Bottom Reorder Controls */}
                          <div className="flex items-center justify-between w-full mt-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveLeft(idx); }} 
                              disabled={idx === 0 || isDeleted || selectionMode}
                              className="p-1.5 text-muted hover:text-text disabled:opacity-20 rounded hover:bg-muted/10 transition-colors"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            
                            <span className="text-[10px] font-medium text-muted truncate px-1">
                              (Orig: {item.originalIndex + 1})
                            </span>
                            
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveRight(idx); }} 
                              disabled={idx === pages.length - 1 || isDeleted || selectionMode}
                              className="p-1.5 text-muted hover:text-text disabled:opacity-20 rounded hover:bg-muted/10 transition-colors"
                              title="Move Right"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </PDFThumbnail>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleSave}
                disabled={keptCount === 0}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LayoutGrid className="w-5 h-5" />
                {keptCount === 0 ? 'No pages included to save' : `Save PDF (${keptCount} pages)`}
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message={`Compiling your organized PDF...`} />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Organized"
        />
      )}
    </ToolPageLayout>
  );
}
