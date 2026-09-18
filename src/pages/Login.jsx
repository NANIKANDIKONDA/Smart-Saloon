import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Scissors, User, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to their role's dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user]);

  const redirectByRole = (role) => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/customer', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password.');
      }
      const authenticatedUser = await login(email.trim(), password);
      if (authenticatedUser?.role) {
        redirectByRole(authenticatedUser.role);
      } else {
        navigate('/customer', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0c0b10] flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full rounded-3xl bg-[#14131d] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#c59a58]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 mx-auto group">
            <div className="w-10 h-10 rounded-2xl bg-[#1c1a26] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58] group-hover:scale-105 transition-transform shadow-gold-sm">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div className="text-left">
              <span className="font-condensed font-bold text-lg text-white uppercase tracking-widest block leading-none">
                SmartSalon
              </span>
              <span className="text-[10px] font-accent italic text-[#dfb76c]">
                Luxury Concierge
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-condensed font-bold uppercase tracking-wider text-white pt-2">
            Sign In to Portal
          </h1>
          <p className="text-xs text-stone-400">
            Enter your credentials to access your designated workspace.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="you@smartsalon.in"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Fill */}
        <div className="pt-4 border-t border-white/5 space-y-2.5">
          <span className="block text-[10px] font-condensed uppercase tracking-wider text-stone-500 text-center">
            Demo Credentials — Instant Quick Fill:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-condensed uppercase tracking-wider">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@smartsalon.in', 'Admin@123')}
              className="p-2 rounded-xl bg-[#1c1b26] border border-white/5 hover:border-[#c59a58]/40 text-stone-300 hover:text-white transition-all text-left"
            >
              <div className="font-bold text-[#dfb76c]">Admin</div>
              <div className="text-stone-500 truncate">admin@smartsalon.in</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('nagoor@example.com', 'Customer@123')}
              className="p-2 rounded-xl bg-[#1c1b26] border border-white/5 hover:border-[#c59a58]/40 text-stone-300 hover:text-white transition-all text-left"
            >
              <div className="font-bold text-[#dfb76c]">Customer</div>
              <div className="text-stone-500 truncate">nagoor@example.com</div>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs font-condensed uppercase tracking-wider text-stone-400 hover:text-white transition-colors"
          >
            ← Return to Customer Website
          </Link>
        </div>
      </div>
    </div>
  );
}
