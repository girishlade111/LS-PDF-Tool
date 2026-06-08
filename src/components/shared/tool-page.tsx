'use client';

import React from 'react';
import { ChevronRight, Home, ArrowLeft, Upload, Settings2, Play, CheckCircle2 } from 'lucide-react';
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
            <div className="flex items-center gap-1.5">
              <div
                className={`
                  flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 shrink-0
                  ${isCompleted
                    ? 'bg-green-500 text-white dark:bg-green-600'
                    : isActive
                      ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-sm shadow-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={`
                  text-xs font-medium transition-colors duration-300 hidden sm:inline
                  ${isActive ? 'text-foreground' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  h-px w-6 sm:w-10 transition-colors duration-300
                  ${currentStep > step.number ? 'bg-green-500 dark:bg-green-600' : 'bg-border'}
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

  if (!tool) return null;

  const Icon = tool.icon;

  // Determine current step
  let currentStep: 1 | 2 | 3 = 1;
  if (processingState === 'success' || processingState === 'error' || processingState === 'processing') {
    currentStep = 3;
  } else if (files.length > 0) {
    currentStep = 2;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
          onClick={goHome}
        >
          <Home className="h-3.5 w-3.5 mr-1" />
          All Tools
        </Button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
        <span className="text-foreground font-medium">{tool.name}</span>
      </nav>

      {/* Back to All Tools link - more prominent */}
      <button
        onClick={goHome}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to All Tools
      </button>

      {/* Header with decorative background */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-muted/20 p-6">
        <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl ${tool.bgColor} shadow-sm`}>
            <Icon className={`h-7 w-7 ${tool.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
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
