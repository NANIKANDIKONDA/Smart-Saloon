import React, { useState } from 'react';
import { Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Franchise() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: 'Kadapa', investment: '₹20L - ₹35L' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block">
          Partnership Opportunities
        </span>
        <h1 className="text-3xl sm:text-5xl font-condensed font-bold uppercase tracking-wider text-white">
          Own a SmartSalon Franchise
        </h1>
        <p className="text-stone-400 text-xs sm:text-sm font-light">
          Join the fastest growing premium salon network across Andhra Pradesh. Proven multi-branch operating model and digital concierge technology.
        </p>
      </div>

      <div className="rounded-3xl bg-[#14131d] border border-white/5 p-8 sm:p-12 shadow-2xl">
        {submitted ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#c59a58] mx-auto" />
            <h3 className="text-xl font-condensed font-bold uppercase text-white">
              Application Received
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              Our franchise development team will reach out to you within 24 hours with the detailed ROI presentation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Preferred Location / City
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Tirupati, Kadapa, Nellore"
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Investment Capacity
                </label>
                <select
                  value={form.investment}
                  onChange={(e) => setForm({ ...form, investment: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                >
                  <option value="₹15L - ₹25L">₹15 Lakhs – ₹25 Lakhs</option>
                  <option value="₹25L - ₹40L">₹25 Lakhs – ₹40 Lakhs</option>
                  <option value="₹40L+">₹40 Lakhs + (Flagship Lounge)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
            >
              Submit Franchise Inquiry
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
