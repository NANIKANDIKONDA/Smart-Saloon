import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Award, ShieldCheck, Clock, MapPin, ArrowRight, Scissors } from 'lucide-react';
import { SALON_INFO } from '../data/mockData';

export default function About() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block">
          Our Heritage & Philosophy
        </span>
        <h1 className="text-3xl sm:text-5xl font-condensed font-bold uppercase tracking-wider text-white">
          Crafting Everyday Luxury Across Andhra Pradesh
        </h1>
        <p className="text-stone-400 text-xs sm:text-base font-light leading-relaxed">
          {SALON_INFO.about}
        </p>
      </div>

      {/* Story & Image Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h2 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Rooted in Precision Barbering & Skin Wellness
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed font-light">
            SmartSalon was founded with a singular ambition: to provide premier metropolitan-grade grooming, clinical skin therapies, and luxurious walk-in booking without the usual waiting chaos.
          </p>
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed font-light">
            Each of our branches in Badvel, Kadapa, Kodur, and Kakinada is built with sterile stations, premium Italian leather chairs, organic botanical preparations, and certified master stylists.
          </p>
          <div className="pt-2">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#b8895b] via-[#c59a58] to-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold hover:scale-[1.02] transition-all"
            >
              <span>Experience The Difference</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-80 sm:h-96 bg-[#181724]">
          <img
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1000&q=80"
            alt="SmartSalon Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="text-xs font-condensed uppercase tracking-widest text-[#dfb76c] font-bold">
              Signature Salon Suites
            </span>
            <p className="text-xs text-stone-300 mt-1">Multi-Branch Presence Across Kadapa & Godavari Regions</p>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-[#14131d] border border-white/5 p-8 space-y-3">
          <Award className="w-8 h-8 text-[#c59a58]" />
          <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
            Certified Master Artisans
          </h3>
          <p className="text-xs text-stone-400 font-light leading-relaxed">
            Continuous training in taper fading, beard sculpting, keratin smoothing, and organic skin care.
          </p>
        </div>

        <div className="rounded-3xl bg-[#14131d] border border-white/5 p-8 space-y-3">
          <ShieldCheck className="w-8 h-8 text-[#c59a58]" />
          <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
            Clinical Hygiene Protocols
          </h3>
          <p className="text-xs text-stone-400 font-light leading-relaxed">
            UV-C sterilized tools, disposable capes, and fresh single-use razor blades for every client.
          </p>
        </div>

        <div className="rounded-3xl bg-[#14131d] border border-white/5 p-8 space-y-3">
          <Clock className="w-8 h-8 text-[#c59a58]" />
          <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
            Punctual Scheduling
          </h3>
          <p className="text-xs text-stone-400 font-light leading-relaxed">
            Strict slot reservation prevents crowding and respects your valuable time.
          </p>
        </div>
      </div>
    </div>
  );
}
