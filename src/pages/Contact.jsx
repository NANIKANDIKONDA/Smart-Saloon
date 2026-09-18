import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
import { SALON_INFO } from '../data/mockData';

export default function Contact({ onOpenChat }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block">
          Reach Us
        </span>
        <h1 className="text-3xl sm:text-5xl font-condensed font-bold uppercase tracking-wider text-white">
          Concierge & Customer Support
        </h1>
        <p className="text-stone-400 text-xs sm:text-sm font-light">
          Have an inquiry regarding our treatments, appointment modifications, or special bridal bookings? We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-[#14131d] border border-white/5 p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58] flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-condensed font-bold uppercase tracking-wider text-white">Phone Concierge</h4>
                <p className="text-xs text-stone-400 mt-1">{SALON_INFO.phone}</p>
                <p className="text-[11px] text-stone-500">Mon–Sat 09:00 AM – 09:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58] flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-condensed font-bold uppercase tracking-wider text-white">Email Inquiries</h4>
                <p className="text-xs text-stone-400 mt-1">{SALON_INFO.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58] flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-condensed font-bold uppercase tracking-wider text-white">Main Flagship</h4>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">{SALON_INFO.address}</p>
              </div>
            </div>

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="w-full py-3 px-4 rounded-xl bg-[#1e1c2a] hover:bg-[#262436] text-[#c59a58] border border-[#c59a58]/30 text-xs font-condensed font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with AI Stylist Instantly</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-[#14131d] border border-white/5 p-6 sm:p-8 shadow-2xl">
            {sent ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#c59a58] mx-auto" />
                <h3 className="text-xl font-condensed font-bold uppercase text-white">
                  Message Sent Successfully
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Thank you for reaching out. A SmartSalon concierge representative will reply shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nagoor Babu"
                      className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Appointment rescheduling or Bridal party inquiry"
                    className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can our concierge team assist you today?"
                    className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
