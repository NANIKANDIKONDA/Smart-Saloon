import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

export default function BranchCard({ branch, onSelect, isSelected = false }) {
  const getStatusInfo = () => {
    const rawStatus = (branch?.status || 'active').toLowerCase();
    if (rawStatus === 'inactive' || rawStatus === 'closed') {
      return { isOpen: false, label: 'CLOSED', color: 'rose' };
    }

    const now = new Date();
    // Sunday closure check (SmartSalon is closed on Sundays)
    if (now.getDay() === 0) {
      return { isOpen: false, label: 'CLOSED SUNDAY', color: 'rose' };
    }

    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const mod = (match[3] || '').toUpperCase();
      if (mod === 'PM' && h < 12) h += 12;
      if (mod === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const openM = parseTime(branch?.opening_time || '09:00 AM');
    const closeM = parseTime(branch?.closing_time || '09:00 PM');
    const curM = now.getHours() * 60 + now.getMinutes();

    if (openM !== null && closeM !== null) {
      if (curM >= openM && curM < closeM) {
        return { isOpen: true, label: 'OPEN NOW', color: 'emerald' };
      } else if (curM < openM) {
        return { isOpen: false, label: `OPENS ${branch.opening_time}`, color: 'amber' };
      } else {
        return { isOpen: false, label: 'CLOSED FOR TODAY', color: 'rose' };
      }
    }

    return { isOpen: true, label: 'OPEN NOW', color: 'emerald' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      onClick={() => onSelect && onSelect(branch)}
      className={`group relative cursor-pointer rounded-3xl p-6 sm:p-7 transition-all duration-300 border ${
        isSelected
          ? 'bg-[#181724] border-[#c59a58] ring-1 ring-[#c59a58] shadow-gold-sm'
          : 'bg-[#13121a] hover:bg-[#181724] border-white/5 hover:border-[#c59a58]/40'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Branch icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58] flex-shrink-0 group-hover:scale-105 transition-transform">
          <MapPin className="w-6 h-6" />
        </div>

        {/* Branch Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-condensed font-bold text-white tracking-wide uppercase truncate">
              {branch.name}
            </h3>
            {statusInfo.isOpen ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {statusInfo.label}
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                statusInfo.color === 'amber' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  statusInfo.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
                {statusInfo.label}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed line-clamp-2">
            {branch.address}
          </p>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs font-condensed uppercase tracking-wider text-[#c59a58] font-semibold group-hover:text-[#dfb76c] flex items-center gap-2">
              {isSelected ? 'SELECTED BRANCH' : 'CHOOSE BRANCH'}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-[11px] text-stone-500">
              {branch.opening_time} – {branch.closing_time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
