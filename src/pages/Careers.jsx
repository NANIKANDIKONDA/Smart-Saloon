import React from 'react';
import { Briefcase, Scissors, Award, ArrowRight } from 'lucide-react';

export default function Careers() {
  const roles = [
    { title: 'Senior Stylist & Barber', branch: 'Badvel & Kadapa', type: 'Full-time', exp: '3+ years experience' },
    { title: 'Clinical Skin Aesthetician', branch: 'Kakinada Main', type: 'Full-time', exp: '2+ years experience' },
    { title: 'Spa & Reflexology Therapist', branch: 'Kadapa-1', type: 'Full-time', exp: '2+ years experience' },
    { title: 'Salon Branch Concierge Manager', branch: 'Kodur Branch', type: 'Full-time', exp: 'Customer service & CRM skills' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block">
          Join Our Family
        </span>
        <h1 className="text-3xl sm:text-5xl font-condensed font-bold uppercase tracking-wider text-white">
          Careers at SmartSalon
        </h1>
        <p className="text-stone-400 text-xs sm:text-sm font-light">
          We offer competitive salaries, artistry masterclasses, performance bonuses, and a supportive workplace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((r, idx) => (
          <div key={idx} className="rounded-3xl bg-[#14131d] border border-white/5 p-6 space-y-4 hover:border-[#c59a58]/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">{r.title}</h3>
                <p className="text-xs text-[#c59a58] mt-0.5">{r.branch}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-condensed uppercase tracking-wider text-stone-400">
                {r.type}
              </span>
            </div>

            <p className="text-xs text-stone-400 font-light">{r.exp}</p>

            <a
              href="mailto:careers@smartsalon.in?subject=Application for Stylist"
              className="inline-flex items-center gap-2 text-xs font-condensed font-bold uppercase tracking-wider text-[#c59a58] hover:text-[#dfb76c] transition-colors"
            >
              <span>Apply via Email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
