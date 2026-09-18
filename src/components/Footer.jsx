import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Clock, MapPin, Phone, Mail, Sparkles, Shield } from 'lucide-react';
import { SALON_INFO } from '../data/mockData';

export default function Footer({ onOpenChat }) {
  return (
    <footer className="bg-[#08070b] border-t border-white/5 text-stone-400 text-xs mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#14131d] border border-[#c59a58]/30 flex items-center justify-center text-[#c59a58]">
                <Scissors className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <span className="font-condensed font-bold text-lg text-white uppercase tracking-wider block leading-none">
                  SmartSalon Luxury
                </span>
                <span className="text-[10px] font-accent italic text-[#dfb76c]">
                  Bespoke Grooming & Aesthetic Lounge
                </span>
              </div>
            </div>
            <p className="text-stone-400 leading-relaxed font-light">
              Elevating personal grooming to an art form across Badvel, Kadapa, Kodur, and Kakinada. Exceptional styling, tranquil private studios, and effortless bookings.
            </p>
            <div className="pt-2">
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#181724] border border-[#c59a58]/30 text-[#dfb76c] text-xs font-condensed font-bold uppercase tracking-wider hover:bg-[#201e2c] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c59a58]" />
                <span>Reserve Walk-In</span>
              </Link>
            </div>
          </div>

          {/* Guest Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-condensed font-bold text-sm uppercase tracking-wider">
              Explore Menu
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="hover:text-[#dfb76c] transition-colors">Home Studio</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#dfb76c] transition-colors">Services Catalogue & Prices</Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-[#dfb76c] transition-colors">Walk-in Appointment Booking</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#dfb76c] transition-colors">Our Master Stylists & Story</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#dfb76c] transition-colors">Customer Profile & Receipts</Link>
              </li>
              <li>
                <Link to="/crm" className="hover:text-[#dfb76c] transition-colors flex items-center gap-1.5 text-stone-500 hover:text-[#dfb76c]">
                  <Shield className="w-3 h-3" />
                  <span>CRM Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations & Timing */}
          <div className="space-y-3">
            <h4 className="text-white font-condensed font-bold text-sm uppercase tracking-wider">
              Premier Branches
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><strong className="text-stone-300">Badvel-1:</strong> Opp: CSI Church</li>
              <li><strong className="text-stone-300">Badvel-2:</strong> Mydukur Road</li>
              <li><strong className="text-stone-300">Kadapa-1:</strong> Co-opp Colony</li>
              <li><strong className="text-stone-300">Kadapa-2:</strong> Chinna chowk</li>
              <li><strong className="text-stone-300">Kadapa-3:</strong> Yerramukkapalli</li>
              <li><strong className="text-stone-300">Kodur:</strong> Tirupathi Road</li>
              <li className="pt-1 text-[#dfb76c] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Mon–Sat 09:00 AM – 09:00 PM (Sun Closed)</span>
              </li>
            </ul>
          </div>

          {/* Concierge Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-condensed font-bold text-sm uppercase tracking-wider">
              Concierge Desk
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#c59a58] flex-shrink-0" />
                <span>{SALON_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#c59a58] flex-shrink-0" />
                <span>{SALON_INFO.email}</span>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#14131d] hover:bg-[#1a1926] border border-white/10 text-stone-300 text-xs font-condensed uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c59a58]" />
                  <span>Ask AI Assistant</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500 font-condensed uppercase tracking-wider">
          <p>© {new Date().getFullYear()} SmartSalon Luxury Group. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
