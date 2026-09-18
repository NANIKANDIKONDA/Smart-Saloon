import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-24 px-4 text-center space-y-6 max-w-md mx-auto animate-fadeIn">
      <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
        <Scissors className="w-8 h-8 -rotate-45" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">404</h1>
        <h2 className="text-xl font-display font-semibold text-neutral-200">Page Not Found</h2>
        <p className="text-neutral-400 text-sm">
          The styling page or treatment path you are looking for does not exist or has moved.
        </p>
      </div>

      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  );
}
