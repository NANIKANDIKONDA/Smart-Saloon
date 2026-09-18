import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DateSelector({
  selectedDate,
  onSelectDate,
  daysCount = 14
}) {
  const today = new Date();

  const dates = Array.from({ length: daysCount }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    const isoString = d.toISOString().split('T')[0];
    const isSunday = d.getDay() === 0;
    const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { isoString, isSunday, dayLabel, monthDay };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs sm:text-sm text-stone-400 font-condensed uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-stone-300">
          <CalendarIcon className="w-4 h-4 text-[#c59a58]" />
          Select Preferred Date
        </span>
        <span className="text-[11px] text-stone-500">Sundays Closed</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {dates.map((item) => {
          const isSelected = selectedDate === item.isoString;
          const disabled = item.isSunday;

          return (
            <button
              key={item.isoString}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate && onSelectDate(item.isoString)}
              className={`flex-shrink-0 w-24 sm:w-28 p-3.5 rounded-2xl border text-center transition-all duration-200 snap-start flex flex-col items-center justify-center ${
                disabled
                  ? 'opacity-35 bg-[#121118] border-white/5 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#1e1c2b] border-[#c59a58] ring-1 ring-[#c59a58] shadow-gold-sm'
                  : 'bg-[#14131c] hover:bg-[#1b1926] border-white/5 hover:border-white/15'
              }`}
            >
              <span
                className={`text-[11px] font-condensed uppercase tracking-wider ${
                  isSelected ? 'text-[#c59a58] font-bold' : disabled ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                {item.dayLabel}
              </span>
              <span
                className={`text-sm sm:text-base font-condensed font-bold mt-1 ${
                  isSelected ? 'text-white' : disabled ? 'text-stone-600' : 'text-stone-200'
                }`}
              >
                {item.monthDay}
              </span>
              {disabled && (
                <span className="mt-1 text-[9px] font-condensed uppercase tracking-wider text-rose-400/80">
                  Closed
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
