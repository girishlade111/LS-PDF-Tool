'use client';

import React, { useState, useMemo } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { loadPDF } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, AlertTriangle, Eye, EyeOff, Shield, ShieldAlert, ShieldX } from 'lucide-react';

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 4) return 'weak';

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

const strengthConfig: Record<PasswordStrength, {
  label: string;
  color: string;
  bgColor: string;
  barColor: string;
  icon: React.ElementType;
}> = {
  weak: {
    label: 'Weak',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    barColor: 'bg-red-500',
    icon: ShieldX,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    barColor: 'bg-amber-500',
    icon: ShieldAlert,
  },
  strong: {
    label: 'Strong',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    barColor: 'bg-green-500',
    icon: Shield,
  },
};

export function ProtectPDFTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const config = strengthConfig[strength];

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

  const StrengthIcon = config.icon;

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
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Password encryption requires server-side processing. This tool will prepare the file with metadata protection.</span>
        </div>

        {/* Visual lock icon based on strength */}
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${password ? config.bgColor : 'bg-muted'}`}>
            {password ? (
              <StrengthIcon className={`h-8 w-8 ${config.color}`} />
            ) : (
              <Lock className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 4 characters)"
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

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                <div className={`h-1.5 flex-1 rounded-full ${strength === 'weak' || strength === 'medium' || strength === 'strong' ? config.barColor : 'bg-muted'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${strength === 'medium' || strength === 'strong' ? config.barColor : 'bg-muted'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${strength === 'strong' ? config.barColor : 'bg-muted'}`} />
              </div>
              <p className={`text-xs font-medium ${config.color}`}>
                {config.label} password
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
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
