import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Branch' },
  { id: 2, name: 'Services' },
  { id: 3, name: 'Date & Time' },
  { id: 4, name: 'Details' },
  { id: 5, name: 'Payment' },
  { id: 6, name: 'Confirmed' },
];

export default function BookingProgress({ currentStep = 1, onStepClick }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-[#1f1d2b] -z-0" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#c59a58] to-[#dfb76c] transition-all duration-500 -z-0"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && step.id < currentStep;

          return (
            <div
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`flex flex-col items-center group relative z-10 ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Circle badge */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-condensed font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#c59a58] text-neutral-950 shadow-gold-sm'
                    : isCurrent
                    ? 'bg-[#181724] border-2 border-[#c59a58] text-[#c59a58] ring-4 ring-[#c59a58]/20 scale-110'
                    : 'bg-[#181724] border border-white/10 text-stone-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={`mt-2 text-[10px] sm:text-xs font-condensed uppercase tracking-wider transition-colors hidden sm:block ${
                  isCurrent
                    ? 'text-[#c59a58] font-bold'
                    : isCompleted
                    ? 'text-stone-300 font-medium'
                    : 'text-stone-600'
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
