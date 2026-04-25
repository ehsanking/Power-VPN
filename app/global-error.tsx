'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Something went wrong</h2>
            <p className="text-slate-600 mb-8">We apologize, but an unexpected error occurred.</p>
            <button
              onClick={() => reset()}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
