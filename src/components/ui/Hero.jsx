import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Home, Scissors } from 'lucide-react';
import { SALON_INFO } from '../../data/mockData';

export default function Hero({ onOpenChat, onSelectHomeService }) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/5 pt-20 pb-24">
      {/* Background imagery + dark overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=85"
          alt="Luxury Salon Interior"
          className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
        />
        {/* Deep charcoal and dark-emerald vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b10] via-[#0c0b10]/85 to-[#0c0b10]/70" />
        <div className="absolute inset-0 bg-[#07100b]/40 mix-blend-multiply" />
      </div>

      {/* Hero Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181724]/90 border border-[#c59a58]/30 text-[#c59a58] text-xs font-condensed uppercase tracking-widest backdrop-blur-md shadow-gold-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#dfb76c]" />
          <span>The Art of Modern Grooming • Multi-Branch Concierge</span>
        </div>

        {/* Large Heading Split: Bold Condensed Line + Elegant Italic Accent Line */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-condensed font-bold uppercase tracking-wider text-white leading-none">
            CRAFTED PERFECTION,
          </h1>
          <p className="text-3xl sm:text-5xl md:text-6xl font-accent italic text-[#dfb76c] font-normal leading-tight">
            Bespoke Luxury Aesthetics.
          </p>
        </div>

        {/* Description */}
        <p className="text-stone-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-sans leading-relaxed font-light">
          {SALON_INFO.subtitle || 'Experience high-end grooming, restorative treatments, and effortless online appointment booking across all our premier branches.'}
        </p>

        {/* Primary CTA "Book Walk-In" + Secondary CTA "Home Service" */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/booking"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#b8895b] via-[#c59a58] to-[#dfb76c] hover:from-[#a77a4d] hover:to-[#cf9f50] text-neutral-950 font-condensed font-bold text-base tracking-wider uppercase shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <Scissors className="w-4 h-4" />
            <span>Book Walk-In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onSelectHomeService}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#181724]/90 hover:bg-[#201e2e] text-stone-200 hover:text-white font-condensed font-semibold text-base tracking-wider uppercase border border-white/10 hover:border-[#c59a58]/50 backdrop-blur-md transition-all flex items-center justify-center gap-2.5"
          >
            <Home className="w-4 h-4 text-[#c59a58]" />
            <span>Home Service</span>
          </button>
        </div>

        {/* AI Chatbot quick trigger */}
        {onOpenChat && (
          <div className="pt-2">
            <button
              onClick={onOpenChat}
              className="text-xs sm:text-sm text-stone-400 hover:text-[#dfb76c] inline-flex items-center gap-2 transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c59a58]" />
              <span>Need recommendations? <span className="underline decoration-[#c59a58]/50">Ask our AI Stylist</span></span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
