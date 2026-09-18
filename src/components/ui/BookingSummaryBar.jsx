import React from 'react';
import { Scissors, ArrowRight } from 'lucide-react';

export default function BookingSummaryBar({
  selectedCount = 0,
  totalPrice = 0,
  onContinue,
  continueLabel = 'CONTINUE',
  disabled = false
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#15141c]/95 backdrop-blur-xl border border-[#c59a58]/30 rounded-2xl sm:rounded-full p-2.5 sm:p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3">
        {/* Left: Count & Total */}
        <div className="pl-3 sm:pl-5 flex flex-col">
          <span className="text-[10px] sm:text-[11px] font-condensed tracking-widest text-stone-400 uppercase font-semibold">
            {selectedCount} {selectedCount === 1 ? 'SELECTED' : 'SELECTED'}
          </span>
          <span className="text-lg sm:text-2xl font-condensed font-bold text-[#c59a58] leading-tight">
            ₹{totalPrice}
          </span>
        </div>

        {/* Center: Scissors icon badge */}
        <div className="hidden sm:flex w-9 h-9 rounded-full bg-[#201e2c] border border-white/5 items-center justify-center text-[#c59a58]">
          <Scissors className="w-4 h-4" />
        </div>

        {/* Right: Continue button */}
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="px-6 sm:px-8 py-3 rounded-xl sm:rounded-full bg-gradient-to-r from-[#b8895b] via-[#c59a58] to-[#dfb76c] hover:from-[#a77a4d] hover:to-[#cf9f50] text-neutral-950 font-condensed font-bold text-sm sm:text-base tracking-wider uppercase shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{continueLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
