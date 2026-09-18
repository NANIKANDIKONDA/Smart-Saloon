import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  User,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import BookingProgress from '../components/ui/BookingProgress';
import BranchCard from '../components/ui/BranchCard';
import ServiceCard from '../components/ui/ServiceCard';
import DateSelector from '../components/ui/DateSelector';
import TimeSlot from '../components/ui/TimeSlot';
import BookingSummaryBar from '../components/ui/BookingSummaryBar';
import PaymentCard from '../components/ui/PaymentCard';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  getActiveBranches,
  getServices,
  getAvailability,
  createBooking
} from '../services/api';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Wizard Step (1 to 6)
  const [step, setStep] = useState(1);

  // Data states
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Selection states
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    notes: ''
  });
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Auto-fill from logged in user if changed
  useEffect(() => {
    if (user) {
      setCustomer((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // Load branches & services on mount
  useEffect(() => {
    getActiveBranches()
      .then((data) => {
        setBranches(data);
        // Check preselected branch from navigation state
        if (location.state?.preSelectedBranchId) {
          const b = data.find((item) => item.id === location.state.preSelectedBranchId);
          if (b) {
            setSelectedBranch(b);
            setStep(2);
          }
        }
      })
      .catch((err) => console.error('Failed to load branches:', err))
      .finally(() => setLoadingBranches(false));

    getServices()
      .then((data) => {
        setServices(data);
        // Check preselected service(s) from navigation state
        if (location.state?.preSelectedServiceId) {
          setSelectedServiceIds(new Set([location.state.preSelectedServiceId]));
        } else if (location.state?.preSelectedServiceIds) {
          setSelectedServiceIds(new Set(location.state.preSelectedServiceIds));
          if (!location.state?.preSelectedBranchId) {
            // If carried from services page, prompt branch selection first
            setStep(1);
          }
        }
      })
      .catch((err) => console.error('Failed to load services:', err))
      .finally(() => setLoadingServices(false));
  }, [location.state]);

  // Fetch slots whenever selectedDate or selectedBranch changes
  useEffect(() => {
    if (!selectedDate || !selectedBranch) return;

    setLoadingSlots(true);
    setError(null);
    getAvailability(selectedDate, selectedBranch.id)
      .then((slots) => {
        setAvailableSlots(slots);
        // Reset time if no longer available
        if (selectedTime && !slots.some((s) => s.time === selectedTime && s.available)) {
          setSelectedTime('');
        }
      })
      .catch((err) => {
        console.error('Failed to load slots:', err);
        setError(err.message || 'Unable to load slots for this date.');
        setAvailableSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedBranch]);

  // Service toggle handler
  const handleToggleService = (service) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(service.id)) {
        next.delete(service.id);
      } else {
        next.add(service.id);
      }
      return next;
    });
  };

  // Selected services calculation
  const selectedServicesList = services.filter((s) => selectedServiceIds.has(s.id));
  const totalAmount = selectedServicesList.reduce((acc, s) => acc + s.price, 0);
  const totalDuration = selectedServicesList.reduce((acc, s) => acc + s.duration, 0);

  // Validate Customer Details step
  const validateDetails = () => {
    if (!customer.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    const cleanPhone = customer.phone.replace(/[\s\-\(\)\+]/g, '');
    if (!customer.phone.trim() || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return false;
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError(null);
    return true;
  };

  // Create booking record when moving to payment step
  const handleProceedToPayment = async () => {
    if (!validateDetails()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        branchId: selectedBranch.id,
        serviceIds: Array.from(selectedServiceIds),
        date: selectedDate,
        timeSlot: selectedTime,
        customerName: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        notes: customer.notes.trim(),
        location: selectedBranch.address,
        bookingType: location.state?.bookingType || 'walk_in'
      };

      const result = await createBooking(payload);
      setConfirmedBooking(result);
      setStep(5); // Advance payment screen
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError(err.message || 'Unable to proceed to payment. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment completed
  const handlePaymentSuccess = () => {
    setStep(6); // Confirmation screen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-36">
      
      {/* 6-step Progress bar */}
      <BookingProgress currentStep={step} onStepClick={(s) => s < step && setStep(s)} />

      {/* Error alert if any */}
      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= STEP 1: SELECT BRANCH ================= */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
              STEP 01 OF 06
            </span>
            <h1 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              SELECT BRANCH
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Choose your nearest SmartSalon location to view real-time stylist availability.
            </p>
          </div>

          {loadingBranches ? (
            <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
              Loading Branches...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((b) => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  isSelected={selectedBranch?.id === b.id}
                  onSelect={(branch) => {
                    setSelectedBranch(branch);
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 2: SELECT SERVICES ================= */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-xs font-condensed uppercase tracking-wider text-stone-400 hover:text-[#c59a58] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Branches</span>
            </button>
            <div className="text-right">
              <span className="text-[11px] font-condensed uppercase tracking-wider text-stone-400 block">
                Branch: <strong className="text-white">{selectedBranch?.name}</strong>
              </span>
            </div>
          </div>

          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
              STEP 02 OF 06
            </span>
            <h1 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              SELECT SERVICES
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Choose one or more treatments. You can combine hair styling, beard grooming, and facial therapies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={selectedServiceIds.has(svc.id)}
                onToggle={handleToggleService}
              />
            ))}
          </div>

          {/* Sticky Summary Bar (Screenshots 2 & 3) */}
          <BookingSummaryBar
            selectedCount={selectedServiceIds.size}
            totalPrice={totalAmount}
            onContinue={() => {
              if (selectedServiceIds.size > 0) {
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            continueLabel="SELECT DATE & TIME"
          />
        </div>
      )}

      {/* ================= STEP 3: DATE & TIME ================= */}
      {step === 3 && (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 text-xs font-condensed uppercase tracking-wider text-stone-400 hover:text-[#c59a58] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </button>
            <div className="text-right text-xs font-condensed uppercase tracking-wider text-[#c59a58]">
              {selectedServicesList.length} Services • ₹{totalAmount} ({totalDuration} mins)
            </div>
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
              STEP 03 OF 06
            </span>
            <h1 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              DATE & TIME SLOT
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Choose an available appointment slot for {selectedBranch?.name}.
            </p>
          </div>

          {/* Date Selector */}
          <div className="bg-[#14131d] rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6">
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />

            {/* Time Slot Grid */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-condensed uppercase tracking-wider text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#c59a58]" />
                  Available Appointment Times
                </span>
                {selectedDate && <span className="text-[#c59a58]">{selectedDate}</span>}
              </div>

              {!selectedDate ? (
                <p className="text-xs text-stone-500 py-6 text-center">
                  Please pick a date above to view available time slots.
                </p>
              ) : loadingSlots ? (
                <p className="text-xs text-stone-400 py-6 text-center font-condensed uppercase">
                  Checking Branch Stylist Availability...
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">
                  No slots available on this day. Please pick another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {availableSlots.map((slot) => (
                    <TimeSlot
                      key={slot.time}
                      time={slot.time}
                      available={slot.available}
                      isSelected={selectedTime === slot.time}
                      onSelect={(t) => setSelectedTime(t)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!selectedDate || !selectedTime}
              onClick={() => {
                setStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-sm tracking-wider uppercase shadow-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>CONTINUE TO DETAILS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: CUSTOMER DETAILS ================= */}
      {step === 4 && (
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 text-xs font-condensed uppercase tracking-wider text-stone-400 hover:text-[#c59a58] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Schedule</span>
            </button>
            <div className="text-right text-xs font-condensed uppercase tracking-wider text-stone-400">
              {selectedDate} at {selectedTime}
            </div>
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
              STEP 04 OF 06
            </span>
            <h1 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              GUEST DETAILS
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Your appointment confirmation and receipt will be sent to these contact details.
            </p>
          </div>

          <div className="bg-[#14131d] rounded-3xl p-6 sm:p-8 border border-white/5 space-y-5">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="e.g. Nagoor Babu"
                className="w-full bg-[#1b1926] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Mobile Number (SMS Updates) *
                </label>
                <input
                  type="tel"
                  required
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#1b1926] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Email Address (Receipt & QR) *
                </label>
                <input
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-[#1b1926] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Special Requests or Styling Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                placeholder="Preferred barber, tea preference, allergies..."
                className="w-full bg-[#1b1926] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>

            {/* Summary review */}
            <div className="pt-4 border-t border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Branch</span>
                <span className="text-white font-semibold">{selectedBranch?.name}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Services ({selectedServicesList.length})</span>
                <span className="text-white font-semibold">
                  {selectedServicesList.map((s) => s.name).join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Total Amount</span>
                <span className="text-white font-semibold">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-[#c59a58] font-bold pt-1">
                <span>Advance Required Now</span>
                <span>₹99</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleProceedToPayment}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-sm tracking-wider uppercase shadow-gold transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'CREATING APPOINTMENT...' : 'PROCEED TO PAYMENT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: ADVANCE PAYMENT (Screenshots 4 & 5) ================= */}
      {step === 5 && confirmedBooking && (
        <div className="space-y-8 max-w-xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
              STEP 05 OF 06
            </span>
            <h1 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              ADVANCE PAYMENT
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Booking ID: <strong className="text-white">{confirmedBooking.bookingId}</strong>
            </p>
          </div>

          <PaymentCard
            booking={confirmedBooking}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={(msg) => setError(msg)}
          />
        </div>
      )}

      {/* ================= STEP 6: CONFIRMATION ================= */}
      {step === 6 && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
          <div className="bg-[#14131d] rounded-3xl p-8 sm:p-10 border border-[#c59a58]/40 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#c59a58]/10 border border-[#c59a58]/30 flex items-center justify-center text-[#c59a58] mx-auto">
              <CheckCircle className="w-9 h-9 text-[#c59a58]" />
            </div>

            <div>
              <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block mb-1">
                APPOINTMENT CONFIRMED
              </span>
              <h2 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
                You're All Set!
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
                Your reservation has been recorded in the SmartSalon Concierge system.
              </p>
            </div>

            {/* Receipt Details Box */}
            <div className="bg-[#1b1926] rounded-2xl p-6 text-left space-y-3 text-xs sm:text-sm border border-white/5">
              <div className="flex justify-between pb-3 border-b border-white/5">
                <span className="text-stone-400 font-condensed uppercase">Booking ID</span>
                <span className="font-mono font-bold text-[#dfb76c]">{confirmedBooking?.bookingId || 'SS-2026-XXXXX'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-condensed uppercase">Branch</span>
                <span className="text-white font-semibold">{selectedBranch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-condensed uppercase">Date & Time</span>
                <span className="text-white font-semibold">{selectedDate} • {selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-condensed uppercase">Customer</span>
                <span className="text-white font-semibold">{customer.name} ({customer.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-condensed uppercase">Advance Paid</span>
                <span className="text-emerald-400 font-bold">₹99 (Online Verified)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-stone-400 font-condensed uppercase">Remaining Balance</span>
                <span className="text-[#c59a58] font-bold">
                  ₹{Math.max(0, totalAmount - 99)} at salon
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1f1d2b] hover:bg-[#282638] text-stone-200 border border-white/10 font-condensed font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Print / Download Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
              >
                View My Bookings
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 text-stone-300 font-condensed uppercase text-xs tracking-wider transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
