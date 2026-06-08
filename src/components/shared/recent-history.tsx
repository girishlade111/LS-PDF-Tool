'use client';

import React, { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { getRecentHistory, OperationHistory } from '@/lib/indexeddb';
import { useNavStore } from '@/store/nav-store';
import { getToolById } from '@/lib/tools';

export function RecentHistory() {
  const [history, setHistory] = useState<OperationHistory[]>([]);
  const { navigate } = useNavStore();

  useEffect(() => {
    getRecentHistory(5).then(setHistory);
  }, []);

  if (history.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent Operations</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {history.map((entry) => {
          const tool = getToolById(entry.toolType);
          if (!tool) return null;
          const Icon = tool.icon;
          const timeAgo = getTimeAgo(entry.createdAt);

          return (
            <button
              key={entry.id}
              onClick={() => navigate(entry.toolType as any)}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left"
            >
              <div className={`p-2 rounded-lg ${tool.bgColor} shrink-0`}>
                <Icon className={`h-4 w-4 ${tool.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tool.name}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
