'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/store/nav-store';
import { getToolById } from '@/lib/tools';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList } from '@/components/shared/file-list';
import { ProcessingStatus } from '@/components/shared/processing-status';
import { DownloadResult } from '@/components/shared/download-result';
import { ErrorDisplay } from '@/components/shared/error-display';
import { useFileStore } from '@/store/file-store';

interface ToolPageProps {
  toolId: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  children: React.ReactNode;
  actionButton: React.ReactNode;
}

export function ToolPage({
  toolId,
  accept = '.pdf',
  multiple = true,
  maxFiles = 10,
  children,
  actionButton,
}: ToolPageProps) {
  const { goHome } = useNavStore();
  const tool = getToolById(toolId);
  const { files, processingState } = useFileStore();

  if (!tool) return null;

  const Icon = tool.icon;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
          onClick={goHome}
        >
          <Home className="h-3.5 w-3.5 mr-1" />
          All Tools
        </Button>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-foreground font-medium">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${tool.bgColor}`}>
          <Icon className={`h-6 w-6 ${tool.color}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <p className="text-muted-foreground mt-1">{tool.description}</p>
        </div>
      </div>

      {/* Tool-specific options */}
      {children}

      {/* File Drop Zone - show when no files or still adding */}
      {(files.length === 0 || processingState === 'idle') && processingState !== 'success' && (
        <FileDropzone
          accept={accept}
          multiple={multiple}
          maxFiles={maxFiles}
        />
      )}

      {/* File List */}
      {files.length > 0 && processingState !== 'success' && (
        <FileList />
      )}

      {/* Action Button - always show when idle, but disabled if no files */}
      {processingState === 'idle' && (
        <div className={files.length === 0 ? 'opacity-40 pointer-events-none' : ''}>
          {actionButton}
        </div>
      )}

      {/* Processing Status */}
      <ProcessingStatus />

      {/* Error Display */}
      <ErrorDisplay />

      {/* Download Result */}
      <DownloadResult />
    </div>
  );
}
