import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive', // 'positive' | 'negative' | 'neutral'
  className = ''
}) {
  return (
    <div className={`rounded-3xl bg-[#14131d] p-6 border border-white/5 shadow-xl flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-condensed uppercase tracking-wider text-stone-400 font-semibold">
          {title}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-[#1e1c2a] border border-white/5 flex items-center justify-center text-[#c59a58]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-condensed font-bold text-white tracking-tight">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  trendType === 'positive'
                    ? 'text-emerald-400'
                    : trendType === 'negative'
                    ? 'text-rose-400'
                    : 'text-stone-400'
                }`}
              >
                {trendType === 'positive' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trend}
              </span>
            )}
            {subtitle && <span className="text-stone-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
