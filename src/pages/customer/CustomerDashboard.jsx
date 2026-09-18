import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCustomerBookings, cancelBooking } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const loadBookings = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await getCustomerBookings(user.email);
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load customer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user?.email]);

  const handleCancel = async () => {
    if (!cancelingId) return;
    try {
      await cancelBooking(cancelingId);
      setNotice('Your appointment has been successfully cancelled.');
      setConfirmOpen(false);
      setCancelingId(null);
      loadBookings();
    } catch (err) {
      setNotice(err.message || 'Failed to cancel appointment.');
    }
  };

  const upcomingBookings = bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Completed');
  const pastBookings = bookings.filter((b) => b.status === 'Cancelled' || b.status === 'Completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#14131d] via-[#1a1826] to-[#14131d] border border-white/10 p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c59a58]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1c2a] border border-[#c59a58]/30 text-xs font-condensed font-bold uppercase tracking-wider text-[#dfb76c]">
              <Sparkles className="w-3 h-3 text-[#c59a58]" />
              <span>SmartSalon Patron Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              Welcome, {user?.name || 'Valued Guest'}
            </h1>
            <p className="text-xs text-stone-400 max-w-xl leading-relaxed">
              Track your upcoming bespoke grooming appointments, view your ritual history, and manage your concierge bookings with ease.
            </p>
          </div>

          <Link
            to="/booking"
            className="self-start sm:self-center px-6 py-3.5 rounded-2xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold flex items-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Ritual</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-[#181724] border border-[#c59a58]/40 text-xs text-[#dfb76c] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#14131d] border border-white/5 space-y-2">
          <span className="text-[10px] font-condensed uppercase tracking-wider text-stone-400">
            Active Appointments
          </span>
          <p className="text-2xl sm:text-3xl font-condensed font-bold text-[#dfb76c]">
            {upcomingBookings.length}
          </p>
          <span className="text-[11px] text-stone-500">Scheduled rituals</span>
        </div>
        <div className="p-6 rounded-3xl bg-[#14131d] border border-white/5 space-y-2">
          <span className="text-[10px] font-condensed uppercase tracking-wider text-stone-400">
            Completed Visits
          </span>
          <p className="text-2xl sm:text-3xl font-condensed font-bold text-white">
            {pastBookings.filter((b) => b.status === 'Completed').length}
          </p>
          <span className="text-[11px] text-stone-500">Total sessions enjoyed</span>
        </div>
        <div className="p-6 rounded-3xl bg-[#14131d] border border-white/5 space-y-2">
          <span className="text-[10px] font-condensed uppercase tracking-wider text-stone-400">
            Membership Tier
          </span>
          <p className="text-2xl sm:text-3xl font-condensed font-bold text-emerald-400">
            VIP Priority
          </p>
          <span className="text-[11px] text-stone-500">Guaranteed advance booking</span>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-condensed font-bold uppercase tracking-wider text-white">
            Upcoming Rituals
          </h2>
          <span className="text-xs text-stone-400 font-condensed uppercase">
            {upcomingBookings.length} Scheduled
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-stone-400 font-condensed uppercase text-sm">
            Loading Appointments...
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#14131d] border border-white/5 text-center space-y-4">
            <Calendar className="w-10 h-10 text-stone-500 mx-auto" />
            <p className="text-sm font-condensed uppercase tracking-wider text-stone-300">
              No upcoming appointments scheduled
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#201e2c] hover:bg-[#282638] text-xs font-condensed font-bold uppercase tracking-wider text-[#dfb76c] transition-colors"
            >
              <span>Explore Treatments & Book</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-3xl bg-[#14131d] border border-white/5 p-6 space-y-5 hover:border-[#c59a58]/30 transition-all shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#dfb76c] block">
                      {b.id}
                    </span>
                    <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white mt-1">
                      {b.service_name || b.serviceName}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-condensed font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#c59a58]" />
                    <span>{b.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c59a58]" />
                    <span>{b.time_slot || b.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-[#c59a58]" />
                    <span className="truncate">{b.branch_name || b.branchId || 'SmartSalon Branch'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-condensed">Advance Paid</span>
                    <span className="font-bold text-emerald-400">₹{b.advance_paid || 99}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelingId(b.id);
                      setConfirmOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-condensed uppercase tracking-wider transition-colors"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking History */}
      {pastBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-condensed font-bold uppercase tracking-wider text-stone-400">
            Past Rituals History
          </h2>
          <div className="rounded-3xl bg-[#14131d] border border-white/5 divide-y divide-white/5 overflow-hidden">
            {pastBookings.map((b) => (
              <div key={b.id} className="p-4 sm:p-5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-stone-400 font-bold block">{b.id}</span>
                  <p className="font-semibold text-white">{b.service_name || b.serviceName}</p>
                  <p className="text-[11px] text-stone-500">{b.date} • {b.time_slot || b.timeSlot}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-condensed uppercase font-bold ${
                  b.status === 'Completed'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'bg-stone-500/15 text-stone-400 border border-stone-500/20'
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you wish to cancel this booking? This slot will be released for other patrons."
        confirmText="Confirm Cancellation"
        danger
      />
    </div>
  );
}
