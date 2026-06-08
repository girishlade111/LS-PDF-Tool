'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { getRecentHistory, OperationHistory } from '@/lib/indexeddb';
import { useNavStore } from '@/store/nav-store';
import { getToolById } from '@/lib/tools';
import { Button } from '@/components/ui/button';

export function RecentHistory() {
  const [history, setHistory] = useState<OperationHistory[]>([]);
  const { navigate } = useNavStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getRecentHistory(10).then(setHistory);
  }, []);

  if (history.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={() => {
              document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            View All Tools
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>

        {/* Horizontal scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {history.map((entry) => {
            const tool = getToolById(entry.toolType);
            if (!tool) return null;
            const Icon = tool.icon;
            const timeAgo = getTimeAgo(entry.createdAt);

            return (
              <button
                key={entry.id}
                onClick={() => navigate(entry.toolType as Parameters<typeof navigate>[0])}
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-lg border bg-background hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left shrink-0 min-w-[180px]"
              >
                <div className={`p-1.5 rounded-md ${tool.bgColor} shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{tool.name}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
