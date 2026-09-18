import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Clock, MapPin, CheckCircle, AlertCircle, XCircle, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, cancelBooking } from '../services/api';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBookings();
  }, [isAuthenticated]);

  const loadBookings = () => {
    setLoading(true);
    getMyBookings()
      .then((data) => setBookings(data))
      .catch((err) => console.error('Failed to load my bookings:', err))
      .finally(() => setLoading(false));
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setIsProcessingCancel(true);
    try {
      await cancelBooking(cancellingBookingId);
      setCancellingBookingId(null);
      loadBookings();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setIsProcessingCancel(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <EmptyState
          title="Account Login Required"
          description="Please log in to access your personal booking history and manage appointments."
          actionLabel="Go to Home & Log In"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Profile Header */}
      <div className="rounded-3xl bg-[#14131d] border border-white/5 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#201e2c] border border-[#c59a58]/30 flex items-center justify-center text-[#c59a58] text-2xl font-bold font-condensed">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
                {user?.name}
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-[#c59a58]/15 border border-[#c59a58]/30 text-[#dfb76c] text-[10px] font-condensed uppercase tracking-wider font-bold">
                {user?.role === 'admin' ? 'Admin' : 'Guest Member'}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">{user?.email} • {user?.phone || 'No phone saved'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/booking')}
          className="px-6 py-3 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold transition-all"
        >
          Book New Walk-In
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-wider text-white">
            My Appointments
          </h2>
          <span className="text-xs text-stone-400 font-condensed uppercase tracking-wider">
            {bookings.length} Total Bookings
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-stone-400 py-12 text-center font-condensed uppercase">
            Loading Appointments...
          </p>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Bookings Yet"
            description="You don't have any appointments scheduled with SmartSalon yet."
            actionLabel="Book Your First Appointment"
            onAction={() => navigate('/booking')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((b) => {
              const isCancelled = b.status === 'Cancelled';
              const isCompleted = b.status === 'Completed';

              return (
                <div
                  key={b.id}
                  className="rounded-3xl bg-[#14131d] border border-white/5 p-6 space-y-4 hover:border-white/15 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#dfb76c]">
                      {b.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-condensed uppercase tracking-wider font-bold ${
                        isCancelled
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          : isCompleted
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
                      {b.service_name}
                    </h3>
                    <div className="mt-2 space-y-1.5 text-xs text-stone-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#c59a58]" />
                        <span>{b.date} at {b.time_slot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#c59a58]" />
                        <span>{b.branch_id ? b.branch_id.toUpperCase() : 'SmartSalon Branch'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-condensed">Amount</span>
                      <span className="text-white font-bold">₹{b.service_price} (₹{b.advance_paid || 99} paid)</span>
                    </div>

                    {!isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => setCancellingBookingId(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-condensed uppercase tracking-wider transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingBookingId)}
        onClose={() => setCancellingBookingId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment reservation? This slot will become available to other guests."
        confirmLabel="Yes, Cancel Booking"
        isDestructive={true}
        isLoading={isProcessingCancel}
      />
    </div>
  );
}
