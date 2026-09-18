import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/customer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let authUser;
      if (isRegister) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        authUser = await register(name.trim(), email.trim(), password, phone.trim());
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter email and password.');
        }
        authUser = await login(email.trim(), password);
      }
      onClose();
      if (authUser?.role) {
        redirectByRole(authUser.role);
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setIsRegister(false);
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Create Account' : 'Welcome Back'}
      subtitle={isRegister ? 'Join SmartSalon Concierge' : 'Log in to view appointments and fast-track booking'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {isRegister && (
          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nagoor Babu"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
              <User className="w-4 h-4 text-stone-500 absolute right-3 top-3" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
            <Mail className="w-4 h-4 text-stone-500 absolute right-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
            <Lock className="w-4 h-4 text-stone-500 absolute right-3 top-3" />
          </div>
        </div>

        {isRegister && (
          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
              <Phone className="w-4 h-4 text-stone-500 absolute right-3 top-3" />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-sm uppercase tracking-wider shadow-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? 'Processing...' : isRegister ? 'Register' : 'Log In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Mode Toggle */}
        <div className="text-center pt-2 text-xs text-stone-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className="text-[#c59a58] hover:underline font-semibold"
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-[#c59a58] hover:underline font-semibold"
              >
                Register
              </button>
            </span>
          )}
        </div>

        {/* Quick test credentials */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-condensed uppercase tracking-wider text-stone-500 text-center">
            Quick Fill Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-condensed uppercase tracking-wider">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@smartsalon.in', 'Admin@123')}
              className="py-1.5 px-2 rounded-lg bg-[#201e2c] hover:bg-[#282638] text-stone-300 border border-white/5 truncate"
            >
              Admin (Full CRM)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('nagoor@example.com', 'Customer@123')}
              className="py-1.5 px-2 rounded-lg bg-[#201e2c] hover:bg-[#282638] text-stone-300 border border-white/5 truncate"
            >
              Customer
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
