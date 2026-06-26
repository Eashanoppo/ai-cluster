'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary p-6">
      <div className="glass-panel p-8 max-w-lg text-center space-y-6 border-red-500/30">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Connection Lost</h2>
          <p className="text-text-secondary text-sm">
            We encountered a critical error communicating with the cluster API.
          </p>
          <div className="mt-4 p-3 bg-surface border border-border rounded text-xs font-mono text-left text-red-400 overflow-auto">
            {error.message || 'Unknown network error.'}
          </div>
        </div>
        <button
          onClick={() => reset()}
          className="bg-primary text-background font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Re-establish Uplink
        </button>
      </div>
    </div>
  );
}
