import { Loader2 } from 'lucide-react';

export default function ProcessingStatus({ progress = 0, message = 'Processing…' }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="bg-surface border border-muted/20 rounded-xl p-8 text-center space-y-4" role="status" aria-live="polite">
      <div className="relative w-16 h-16 mx-auto">
        <Loader2
          size={32}
          className="text-primary animate-spin"
          aria-hidden="true"
          strokeWidth={2.5}
        />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-text">{message}</p>
        <div className="w-full max-w-md mx-auto h-3 bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Processing progress"
          />
        </div>
        <p className="text-2xl font-bold text-primary tabular-nums">
          {Math.round(clampedProgress)}%
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}