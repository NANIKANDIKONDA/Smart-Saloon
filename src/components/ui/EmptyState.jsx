import React from 'react';
import { Sparkles } from 'lucide-react';

export default function EmptyState({
  title = 'No Records Found',
  description = 'There are no items matching your criteria at this moment.',
  icon: Icon = Sparkles,
  actionLabel,
  onAction
}) {
  return (
    <div className="rounded-3xl bg-[#14131d] p-10 sm:p-14 border border-white/5 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#1e1c2a] border border-white/5 flex items-center justify-center text-[#c59a58]">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h4 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-wider text-white">
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xs mx-auto">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-6 py-2.5 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
