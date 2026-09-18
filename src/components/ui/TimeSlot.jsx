import React from 'react';
import { Clock } from 'lucide-react';

export default function TimeSlot({
  time,
  available = true,
  isSelected = false,
  onSelect
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => available && onSelect && onSelect(time)}
      className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider transition-all duration-200 border flex items-center justify-center gap-1.5 ${
        !available
          ? 'bg-[#121118] border-white/5 text-stone-600 line-through cursor-not-allowed opacity-45'
          : isSelected
          ? 'bg-[#c59a58] border-[#c59a58] text-neutral-950 shadow-gold'
          : 'bg-[#15141d] hover:bg-[#1c1b28] border-white/10 hover:border-[#c59a58]/40 text-stone-200'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-neutral-950' : 'text-[#c59a58]'}`} />
      <span>{time}</span>
    </button>
  );
}
