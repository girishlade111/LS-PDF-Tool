'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { getPDFMetadata, editPDFMetadata } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  User,
  BookOpen,
  Tags,
  Monitor,
  Printer,
  Calendar,
  Save,
} from 'lucide-react';

interface MetadataState {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
}

const defaultMetadata: MetadataState = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
  creator: '',
  producer: '',
  creationDate: '',
  modificationDate: '',
};

function formatDate(date: Date | undefined): string {
  if (!date) return 'Not set';
  try {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

export function EditMetadataTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [metadata, setMetadata] = useState<MetadataState>(defaultMetadata);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const loadMetadata = useCallback(async (fileData: ArrayBuffer) => {
    setLoadingMeta(true);
    try {
      const meta = await getPDFMetadata(fileData);
      setMetadata({
        title: meta.title || '',
        author: meta.author || '',
        subject: meta.subject || '',
        keywords: meta.keywords ? meta.keywords.join(', ') : '',
        creator: meta.creator || '',
        producer: meta.producer || '',
        creationDate: formatDate(meta.creationDate),
        modificationDate: formatDate(meta.modificationDate),
      });
    } catch {
      setMetadata(defaultMetadata);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      loadMetadata(files[0].data);
    } else {
      setMetadata(defaultMetadata);
    }
  }, [files, loadMetadata]);

  const handleSave = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Updating metadata...');
      setProgress(30, 'Reading document...');

      const keywordsArray = metadata.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      setProgress(60, 'Applying metadata...');
      const result = await editPDFMetadata(files[0].data, {
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        keywords: keywordsArray,
      });

      setProgress(90, 'Creating file...');
      const blob = new Blob([result], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `metadata-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metadata');
    }
  };

  const updateField = (field: keyof MetadataState, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ToolPage
      toolId="edit-metadata"
      multiple={false}
      maxFiles={1}
      actionButton={
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full sm:w-auto"
          disabled={files.length === 0 || loadingMeta}
        >
          <Save className="h-4 w-4 mr-2" />
          Save with Updated Metadata
        </Button>
      }
    >
      {files.length > 0 && !loadingMeta && (
        <div className="space-y-4">
          {/* Editable fields */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Editable Fields
              </p>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Title
                </Label>
                <Input
                  value={metadata.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter document title"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Author
                </Label>
                <Input
                  value={metadata.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  placeholder="Enter author name"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Subject
                </Label>
                <Input
                  value={metadata.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tags className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Keywords
                </Label>
                <Input
                  value={metadata.keywords}
                  onChange={(e) => updateField('keywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-muted-foreground">
                  Separate keywords with commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Read-only fields */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Read-Only Fields
              </p>

              <div className="flex items-center gap-3 py-2">
                <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Creator</p>
                  <p className="text-sm truncate">
                    {metadata.creator || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Printer className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Producer</p>
                  <p className="text-sm truncate">
                    {metadata.producer || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Creation Date</p>
                  <p className="text-sm">{metadata.creationDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Modification Date
                  </p>
                  <p className="text-sm">{metadata.modificationDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {files.length > 0 && loadingMeta && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">
            Loading metadata...
          </span>
        </div>
      )}
    </ToolPage>
  );
}
