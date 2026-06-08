'use client';

import React, { useEffect } from 'react';
import { ChevronRight, Home, ArrowLeft, Upload, Settings2, Play, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavStore } from '@/store/nav-store';
import { getToolById } from '@/lib/tools';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList } from '@/components/shared/file-list';
import { ProcessingStatus } from '@/components/shared/processing-status';
import { DownloadResult } from '@/components/shared/download-result';
import { ErrorDisplay } from '@/components/shared/error-display';
import { useFileStore } from '@/store/file-store';

const SITE_NAME = 'LS PDF';
const DEFAULT_TITLE = `Free Online PDF Editor — Merge, Split, Compress & More | ${SITE_NAME}`;

interface ToolPageProps {
  toolId: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, label: 'Upload', icon: Upload },
    { number: 2, label: 'Configure', icon: Settings2 },
    { number: 3, label: 'Process', icon: Play },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  relative flex items-center justify-center rounded-full transition-all duration-300 shrink-0
                  ${isCompleted
                    ? 'h-8 w-8 bg-green-500 text-white dark:bg-green-600'
                    : isActive
                      ? 'h-9 w-9 bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-sm shadow-primary/20 animate-step-pulse'
                      : 'h-7 w-7 bg-muted text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-600 dark:bg-green-700 ring-2 ring-white dark:ring-green-500">
                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                    </span>
                    <StepIcon className="h-4 w-4" />
                  </>
                ) : (
                  <StepIcon className={isActive ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                )}
              </div>
              <span
                className={`
                  text-[10px] sm:text-xs font-medium transition-colors duration-300 text-center
                  ${isActive ? 'text-foreground' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  relative h-0.5 w-6 sm:w-10 mt-[-16px] sm:mt-[-18px] transition-all duration-500 rounded-full overflow-hidden
                  ${currentStep > step.number ? 'animate-line-flow' : 'bg-border'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
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

  // Per-route <title> for browser tab + history/SEO.
  // Restores the default title when the user navigates away.
  useEffect(() => {
    if (typeof document === 'undefined' || !tool) return undefined;
    const previousTitle = document.title;
    document.title = `${tool.name} — ${SITE_NAME}`;
    return () => {
      document.title = previousTitle || DEFAULT_TITLE;
    };
  }, [tool]);

  if (!tool) return null;

  const Icon = tool.icon;
  const isAITool = ['pdf-to-markdown', 'ocr-pdf', 'summarize-pdf', 'pdf-to-docx'].includes(toolId);

  // Determine current step
  let currentStep: 1 | 2 | 3 = 1;
  if (processingState === 'success' || processingState === 'error' || processingState === 'processing') {
    currentStep = 3;
  } else if (files.length > 0) {
    currentStep = 2;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 animate-page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
          onClick={goHome}
          aria-label="Back to all tools"
        >
          <Home className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          All Tools
        </Button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
        <span className="text-foreground font-medium" aria-current="page">{tool.name}</span>
      </nav>

      {/* Back to All Tools link - more prominent */}
      <button
        type="button"
        onClick={goHome}
        aria-label="Back to all tools"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        Back to All Tools
      </button>

      {/* Header with decorative background */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-muted/20 p-6 group">
        {/* Animated decorative gradient orbs */}
        <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-all duration-700 group-hover:from-primary/10 group-hover:blur-3xl" />
        <div className="absolute bottom-0 left-0 h-20 w-20 translate-y-4 -translate-x-4 rounded-full bg-gradient-to-tr from-primary/3 to-transparent blur-xl" />

        <div className="relative flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl ${tool.bgColor} shadow-sm transition-transform duration-300 group-hover:scale-105`}>
            <Icon className={`h-7 w-7 ${tool.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
              {isAITool && (
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-5 border-0 gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI Powered
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1.5">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Tool-specific options */}
      {children}

      {/* File Drop Zone */}
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

      {/* Action Button */}
      {processingState === 'idle' && actionButton && (
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
