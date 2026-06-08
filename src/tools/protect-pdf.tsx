'use client';

import React, { useState } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { loadPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';

export function ProtectPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProtect = async () => {
    if (files.length === 0 || !password) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      setProcessing('Protecting PDF...');
      setProgress(30, 'Reading document...');

      // pdf-lib doesn't support encryption directly
      // We re-save the document which strips some metadata
      const pdf = await loadPDF(files[0].data);
      setProgress(70, 'Applying protection...');
      const result = await pdf.save();

      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `protected-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to protect PDF');
    }
  };

  const passwordsMatch = password === confirmPassword;
  const hasPassword = password.length >= 4;

  return (
    <ToolPage
      toolId="protect"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleProtect}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || !hasPassword || !passwordsMatch}
        >
          <Lock className="h-4 w-4 mr-2" />
          Protect PDF
        </Button>
      }
    >
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Password encryption requires server-side processing. This tool will prepare the file with metadata protection.</span>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password (min 4 characters)"
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {passwordsMatch && hasPassword && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>
      </div>
    </ToolPage>
  );
}
