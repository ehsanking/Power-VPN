import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-6 bg-red-50 text-red-500 rounded-full mb-6">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-4xl font-black text-slate-800 mb-2">404</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        The page you are looking for has been disconnected or does not exist.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
