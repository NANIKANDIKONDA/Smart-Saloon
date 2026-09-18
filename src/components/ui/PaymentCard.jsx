import React, { useState } from 'react';
import { CreditCard, Check, ShieldCheck, Smartphone, Landmark, Wallet, X } from 'lucide-react';
import { createPaymentOrder, verifyPayment } from '../../services/api';

export default function PaymentCard({
  booking,
  onPaymentSuccess,
  onPaymentError
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [activeOrder, setActiveOrder] = useState(null);

  const advanceAmount = booking.advancePaid || 99;
  const remainingAmount = booking.balanceDue || Math.max(0, (booking.totalAmount || booking.price || 199) - advanceAmount);

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    try {
      const order = await createPaymentOrder(advanceAmount, booking.bookingId);
      setActiveOrder(order);
      setShowRazorpayModal(true);
    } catch (err) {
      console.error('Failed to create payment order:', err);
      onPaymentError && onPaymentError(err.message || 'Unable to initialize payment gateway.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteMockOrLivePayment = async () => {
    if (!activeOrder) return;
    setIsProcessing(true);

    try {
      const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const verificationPayload = {
        booking_id: booking.bookingId,
        razorpay_order_id: activeOrder.order_id,
        razorpay_payment_id: paymentId,
        razorpay_signature: `mock_sig_${activeOrder.order_id}_${paymentId}`,
        method: selectedMethod
      };

      const result = await verifyPayment(verificationPayload);
      setShowRazorpayModal(false);
      onPaymentSuccess && onPaymentSuccess(result);
    } catch (err) {
      console.error('Payment verification failed:', err);
      onPaymentError && onPaymentError(err.message || 'Payment verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Advance Payment Confirmation Card (Screenshot 4) */}
      <div className="bg-[#14131d] rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6">
        <div className="flex items-center justify-between p-5 rounded-2xl bg-[#1c1a26] border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#262436] flex items-center justify-center text-[#c59a58]">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-wider text-white">
                CONFIRM BOOKING
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-400 font-medium">
                PAY SMALL ADVANCE
              </p>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-condensed font-bold text-[#c59a58]">
            ₹{advanceAmount}
          </div>
        </div>

        {/* Big Pay Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleInitiatePayment}
          className="w-full py-4 px-6 rounded-2xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-base sm:text-lg tracking-wider uppercase shadow-gold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>
            {isProcessing ? 'INITIALIZING PAYMENT...' : `PAY ₹${advanceAmount} NOW`}
          </span>
        </button>

        {/* Remaining amount notice */}
        <div className="text-center space-y-2">
          <p className="text-xs sm:text-sm font-condensed uppercase tracking-widest text-stone-400">
            PAY THE REMAINING <span className="text-[#c59a58] font-bold">₹{remainingAmount}</span> AT THE SALOON
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] sm:text-xs font-condensed uppercase tracking-wider text-stone-500">
            <span>UPI</span>
            <span>•</span>
            <span>CARDS</span>
            <span>•</span>
            <span>CASH</span>
            <span>•</span>
            <span>NET BANKING</span>
          </div>
        </div>
      </div>

      {/* Razorpay Standard Checkout Modal (Screenshot 5) */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#fdfcf9] dark:bg-[#12111a] rounded-3xl overflow-hidden shadow-2xl border border-[#c59a58]/30 grid grid-cols-1 md:grid-cols-12 text-stone-900 dark:text-white">
            
            {/* Left Gold Sidebar */}
            <div className="md:col-span-5 bg-gradient-to-b from-[#c59a58] via-[#b88d4c] to-[#997034] p-6 text-neutral-950 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center font-bold text-lg">
                    S
                  </div>
                  <div>
                    <h3 className="font-condensed font-bold text-lg uppercase tracking-wide leading-tight">
                      SmartSalon Luxury
                    </h3>
                    <p className="text-[11px] text-neutral-900/80">Secured Advance Checkout</p>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900/80 block">
                    Price Summary
                  </span>
                  <div className="text-3xl font-condensed font-bold mt-1">
                    ₹{advanceAmount}
                  </div>
                  <span className="text-[11px] text-neutral-900/70">
                    Slot reservation token (Non-refundable after check-in)
                  </span>
                </div>

                <div className="text-xs font-medium bg-black/10 rounded-xl p-3">
                  <span className="block text-[10px] text-neutral-900/70 uppercase font-bold">Booking For</span>
                  <p className="font-semibold text-neutral-950 truncate">{booking.customerName || 'Salon Guest'}</p>
                  <p className="text-neutral-900/80">{booking.phone || '+91 Mobile'}</p>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-neutral-950">
                <ShieldCheck className="w-4 h-4" />
                <span>Secured by Razorpay</span>
              </div>
            </div>

            {/* Right Payment Methods Pane */}
            <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-5 bg-[#161520]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="font-condensed font-bold text-base uppercase tracking-wider text-white">
                    Payment Options
                  </h4>
                  <p className="text-[11px] text-stone-400">Select your preferred advance mode</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRazorpayModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Methods List */}
              <div className="space-y-3">
                {[
                  { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', icon: Smartphone, badge: 'Instant Confirmation' },
                  { id: 'Cards', label: 'Credit / Debit Cards', icon: CreditCard, badge: 'Visa, Mastercard, RuPay' },
                  { id: 'Netbanking', label: 'Net Banking', icon: Landmark, badge: 'All Indian Banks' },
                  { id: 'Wallet', label: 'Wallets', icon: Wallet, badge: 'Paytm, Amazon Pay' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isCur = selectedMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isCur
                          ? 'bg-[#222030] border-[#c59a58] ring-1 ring-[#c59a58]'
                          : 'bg-[#1a1924] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isCur ? 'bg-[#c59a58] text-neutral-950' : 'bg-white/5 text-stone-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-white">{m.label}</p>
                          <p className="text-[10px] text-stone-400">{m.badge}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isCur ? 'border-[#c59a58] bg-[#c59a58]' : 'border-stone-600'
                      }`}>
                        {isCur && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirmation CTA */}
              <div className="pt-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteMockOrLivePayment}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#b8895b] via-[#c59a58] to-[#dfb76c] hover:from-[#a77a4d] hover:to-[#cf9f50] text-neutral-950 font-condensed font-bold text-sm tracking-wider uppercase shadow-gold transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'VERIFYING...' : `AUTHORIZE & PAY ₹${advanceAmount}`}
                  </span>
                </button>
                <p className="mt-2 text-center text-[10px] text-stone-500">
                  By proceeding, you agree to SmartSalon Terms & Privacy Notice
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
