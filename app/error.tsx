'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-200px)] w-full flex-col items-center justify-center space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Something went wrong!</h2>
      <p className="text-slate-500 max-w-md text-center text-sm">
        An error occurred while rendering this section.
      </p>
      <button
        className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-700 transition"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
