'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Ghost, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHistory, clearHistory } from '@/utils/indexedDBUtils';
import { getToolById } from '@/lib/tools';
import { formatFileSize } from '@/lib/pdf-utils';
import { getRelativeTime } from '@/utils/timeUtils';

function truncateFilename(filename) {
  if (!filename) return 'Unknown file';
  if (filename.length <= 30) return filename;
  return `${filename.slice(0, 27)}...`;
}

function getEntryTimestamp(entry) {
  if (typeof entry.createdAt === 'number') {
    return new Date(entry.createdAt).toISOString();
  }

  return entry.createdAt || entry.timestamp || new Date().toISOString();
}

function getEntryFilename(entry) {
  if (entry.filename) return entry.filename;
  if (Array.isArray(entry.inputFiles) && entry.inputFiles.length > 0) {
    return entry.inputFiles[0];
  }
  if (Array.isArray(entry.outputFiles) && entry.outputFiles.length > 0) {
    return entry.outputFiles[0];
  }
  return 'Unknown file';
}

function getEntrySize(entry) {
  if (typeof entry.fileSize === 'number') return entry.fileSize;
  if (typeof entry.size === 'number') return entry.size;
  return 0;
}

export function RecentHistory() {
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    getHistory()
      .then((entries) => {
        if (mounted) setHistory(entries.slice(0, 5));
      })
      .catch(() => {
        if (mounted) setHistory([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (history.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [history.length]);

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Recent Activity</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearHistory}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear History
          </Button>
        </div>

        {history.length > 0 ? (
          <ul className="divide-y rounded-lg border bg-background">
            {history.map((entry) => {
              const tool = getToolById(entry.toolType);
              const Icon = tool?.icon || Clock;
              const status = entry.status === 'error' ? 'error' : 'success';
              const timestamp = getEntryTimestamp(entry);

              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`shrink-0 rounded-lg p-2 ${tool?.bgColor || 'bg-muted'}`}>
                      <Icon className={`h-4 w-4 ${tool?.color || 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-medium text-sm">{tool?.name || entry.toolName || 'PDF Tool'}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {truncateFilename(getEntryFilename(entry))}
                        </p>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(getEntrySize(entry))}</span>
                        <span aria-hidden="true">.</span>
                        <span>{getRelativeTime(timestamp, now)}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      status === 'success'
                        ? 'w-fit border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                        : 'w-fit border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
                    }
                  >
                    {status === 'success' ? 'Success' : 'Error'}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-background px-4 py-8 text-sm text-muted-foreground">
            <Ghost className="h-4 w-4" />
            No recent activity yet. Try a tool above.
          </div>
        )}
      </div>
    </section>
  );
}
