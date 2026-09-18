import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, User, FileText, Home as HomeIcon, Smartphone, MessageSquare, Copy, Check } from 'lucide-react';
import { SALON_INFO } from '../data/mockData';

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking);
    } else {
      try {
        const saved = localStorage.getItem('smartsalon_last_booking');
        if (saved) {
          setBooking(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error reading last booking', e);
      }
    }
  }, [location.state]);

  if (!booking) {
    return (
      <div className="py-24 px-4 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-condensed font-bold uppercase text-white">No active confirmation</h2>
        <p className="text-stone-400 text-xs">
          No recent appointment record found in your current session.
        </p>
        <Link
          to="/booking"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold"
        >
          Book an Appointment
        </Link>
      </div>
    );
  }

  const {
    bookingId,
    customerName,
    serviceName,
    date,
    timeSlot,
    price,
    totalAmount,
    advancePaid = 99,
    balanceDue = 0,
    branchName = 'SmartSalon Branch'
  } = booking;

  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
      <div className="bg-[#14131d] rounded-3xl p-8 sm:p-10 border border-[#c59a58]/40 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#c59a58]/10 border border-[#c59a58]/30 flex items-center justify-center text-[#c59a58] mx-auto">
          <CheckCircle className="w-9 h-9 text-[#c59a58]" />
        </div>

        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block mb-1">
            APPOINTMENT CONFIRMED
          </span>
          <h1 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
            Reserved at {branchName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 font-light">
            Your styling chair has been reserved. Please arrive 5 minutes prior to your slot.
          </p>
        </div>

        {/* Receipt Box */}
        <div className="bg-[#1a1924] rounded-2xl p-6 text-left space-y-3 text-xs sm:text-sm border border-white/5">
          <div className="flex justify-between pb-3 border-b border-white/5">
            <span className="text-stone-400 font-condensed uppercase">Booking ID</span>
            <span className="font-mono font-bold text-[#dfb76c]">{bookingId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 font-condensed uppercase">Treatment</span>
            <span className="text-white font-semibold">{serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 font-condensed uppercase">Date & Time</span>
            <span className="text-white font-semibold">{date} • {timeSlot}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 font-condensed uppercase">Customer</span>
            <span className="text-white font-semibold">{customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400 font-condensed uppercase">Advance Paid</span>
            <span className="text-emerald-400 font-bold">₹{advancePaid} (Online Verified)</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/5">
            <span className="text-stone-400 font-condensed uppercase">Remaining Balance</span>
            <span className="text-[#c59a58] font-bold">₹{balanceDue} at salon</span>
          </div>
        </div>

        {/* Appendix A Mobile Notification Card */}
        <div className="bg-[#1a1924] rounded-2xl p-6 text-left space-y-4 border border-[#c59a58]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#c59a58]" />
              <span className="font-condensed font-bold uppercase tracking-wider text-white text-xs">
                Customer Mobile Notification
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Direct Mobile Dispatch
            </span>
          </div>

          <p className="text-[11px] text-stone-400">
            Your appointment confirmation formatted per Appendix A is ready to deliver directly to your phone ({booking?.phone || 'mobile'}).
          </p>

          {/* Formatted Appendix A Preview */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-stone-300 leading-relaxed whitespace-pre-line">
            {booking?.notification_message || (
              `Hi ${customerName || 'Guest'}, your SmartSalon appointment is confirmed.\n` +
              `Booking ID: ${bookingId}\n` +
              `Service: ${serviceName}\n` +
              `Branch: ${branchName}\n` +
              `Date: ${date}\n` +
              `Time: ${timeSlot}\n` +
              `Price: ₹${totalAmount || price || 199}\n` +
              `Duration: 45 mins\n` +
              `We look forward to seeing you!`
            )}
          </div>

          {/* Action Buttons: WhatsApp & Native SMS & Copy */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <a
              href={
                booking?.whatsapp_url ||
                `https://api.whatsapp.com/send?phone=91${(booking?.phone || '').replace(/\D/g, '').slice(-10)}&text=${encodeURIComponent(
                  booking?.notification_message ||
                  `Hi ${customerName}, your SmartSalon appointment is confirmed. Booking ID: ${bookingId} Service: ${serviceName} Branch: ${branchName} Date: ${date} Time: ${timeSlot} We look forward to seeing you!`
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 font-condensed font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </a>

            <a
              href={
                booking?.sms_url ||
                `sms:${(booking?.phone || '').replace(/\D/g, '').slice(-10)}?body=${encodeURIComponent(
                  booking?.notification_message ||
                  `Hi ${customerName}, your SmartSalon appointment is confirmed. Booking ID: ${bookingId}`
                )}`
              }
              className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl bg-[#c59a58]/20 hover:bg-[#c59a58]/30 text-[#dfb76c] border border-[#c59a58]/30 font-condensed font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open in Mobile SMS</span>
            </a>

            <button
              type="button"
              onClick={() => {
                const text = booking?.notification_message ||
                  `Hi ${customerName}, your SmartSalon appointment is confirmed. Booking ID: ${bookingId} Service: ${serviceName} Branch: ${branchName} Date: ${date} Time: ${timeSlot} We look forward to seeing you!`;
                navigator.clipboard?.writeText(text);
                setCopiedMessage(true);
                setTimeout(() => setCopiedMessage(false), 2500);
              }}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-condensed uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-white/5"
            >
              {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMessage ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1f1d2b] hover:bg-[#282638] text-stone-200 border border-white/10 font-condensed font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
          >
            View My Profile
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 text-stone-300 font-condensed uppercase text-xs tracking-wider transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
