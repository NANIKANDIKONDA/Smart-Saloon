import React from 'react';
import { Check, Plus } from 'lucide-react';

export default function ServiceCard({
  service,
  isSelected = false,
  onToggle
}) {
  return (
    <div
      onClick={() => onToggle && onToggle(service)}
      className={`group cursor-pointer rounded-3xl overflow-hidden bg-[#13121a] border transition-all duration-300 flex flex-col ${
        isSelected
          ? 'border-[#c59a58] ring-1 ring-[#c59a58] shadow-gold-sm bg-[#171622]'
          : 'border-white/5 hover:border-white/15 hover:bg-[#161520]'
      }`}
    >
      {/* Image container */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#1a1924]">
        <img
          src={service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80'}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13121a] via-transparent to-black/30" />

        {/* Duration badge pill */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-condensed font-bold tracking-wider text-stone-200">
          {service.duration} MIN
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-wider text-[#c59a58] group-hover:text-[#dfb76c] transition-colors leading-snug line-clamp-2">
            {service.name}
          </h3>
          <p className="mt-1.5 text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        <div className="pt-2">
          <div className="text-xl sm:text-2xl font-condensed font-bold text-white mb-3">
            ₹{service.price}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle && onToggle(service);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-condensed uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSelected
                ? 'bg-[#c59a58] text-neutral-950 shadow-gold'
                : 'bg-[#22202c] hover:bg-[#2c2a38] text-stone-300 border border-white/5'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />
                <span>SELECTED</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>ADD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
