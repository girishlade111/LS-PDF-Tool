'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { unlockPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Unlock, Info, Eye, EyeOff, LockOpen, Lock } from 'lucide-react';

export function UnlockPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Unlocking PDF...');
      setProgress(30, 'Reading encrypted document...');

      const result = await unlockPDF(files[0].data, password || undefined);

      setProgress(70, 'Removing encryption...');
      setProgress(90, 'Creating unlocked file...');

      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `unlocked-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock PDF. The password may be incorrect.');
    }
  };

  return (
    <ToolPage
      toolId="unlock"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleUnlock}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0}
        >
          <Unlock className="h-4 w-4 mr-2" />
          Unlock PDF
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Info card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  This tool removes password protection and encryption from PDF files. Upload a protected PDF and provide the password to unlock it.
                </p>
                <p>
                  The resulting file will be free of restrictions, allowing you to edit, copy, and print the document.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual lock/unlock animation */}
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            files.length > 0
              ? 'bg-indigo-50 dark:bg-indigo-950/30'
              : 'bg-muted'
          }`}>
            {files.length > 0 ? (
              <LockOpen className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Lock className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Password input */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Unlock className="h-4 w-4 text-indigo-500" />
            Unlock Options
          </h3>

          <div className="space-y-2">
            <Label>Document Password (if required)</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the PDF password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty if the PDF only has restrictions (no open password).
            </p>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
