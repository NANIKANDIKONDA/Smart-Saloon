import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick,
  emptyMessage = 'No records found.'
}) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl bg-[#14131d] p-12 border border-white/5 text-center text-stone-400 font-condensed uppercase tracking-wider text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[#14131d] border border-white/5 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#191824]/60">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-4 px-5 text-[11px] sm:text-xs font-condensed font-bold uppercase tracking-wider text-stone-400 ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
            {data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#1b1926]'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`py-4 px-5 text-stone-300 ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
