import React from 'react';

export default function ChartCard({
  title,
  subtitle,
  data = [],
  valueKey = 'revenue',
  labelKey = 'day',
  barColor = '#c59a58'
}) {
  const maxValue = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="rounded-3xl bg-[#14131d] p-6 border border-white/5 shadow-xl flex flex-col justify-between">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-wider text-white">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6">
        {data.map((item, idx) => {
          const val = item[valueKey] || 0;
          const heightPct = Math.max(8, Math.round((val / maxValue) * 100));

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 px-2 py-1 rounded bg-[#201e2c] border border-white/10 text-[10px] font-condensed text-[#c59a58] whitespace-nowrap pointer-events-none shadow-lg">
                ₹{val}
              </div>

              {/* Bar */}
              <div
                className="w-full max-w-[28px] rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: barColor,
                  boxShadow: '0 4px 15px rgba(197, 154, 88, 0.2)'
                }}
              />

              {/* Label */}
              <span className="mt-2 text-[10px] sm:text-xs font-condensed uppercase tracking-wider text-stone-400 group-hover:text-white transition-colors">
                {item[labelKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
