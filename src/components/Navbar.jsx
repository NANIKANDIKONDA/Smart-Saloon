import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, User, Menu, X, Shield, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar({ onOpenChat }) {
  const { pathname } = useLocation();
  const { user, isAuthenticated, isStaffOrManager, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Franchise', path: '/franchise' },
    { name: 'Careers', path: '/careers' },
    { name: 'Reach Us', path: '/contact' },
  ];

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'customer':
      default:
        return '/customer';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin Console';
      case 'manager':
        return 'Manager Console';
      case 'staff':
        return 'Staff Portal';
      case 'customer':
      default:
        return 'My Patron Portal';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0c0b10]/95 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#181724] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58] group-hover:scale-105 transition-transform shadow-gold-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-condensed font-bold text-xl sm:text-2xl text-white tracking-widest uppercase block leading-none">
                SmartSalon
              </span>
              <span className="text-[10px] font-accent italic text-[#dfb76c] tracking-wider block">
                Luxury Grooming
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-condensed font-semibold uppercase tracking-wider transition-colors hover:text-[#dfb76c] ${
                    active ? 'text-[#c59a58] border-b border-[#c59a58] pb-1' : 'text-stone-300'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && (
              <Link
                to={getDashboardRoute(user?.role)}
                className="px-3.5 py-2 rounded-xl bg-[#201e2c] hover:bg-[#282638] text-xs font-condensed font-bold uppercase tracking-wider text-[#dfb76c] border border-[#c59a58]/30 flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-[#c59a58]" />
                <span>{getRoleLabel(user?.role)}</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={getDashboardRoute(user?.role)}
                  className="px-3.5 py-2 rounded-xl bg-[#181724] hover:bg-[#222030] text-xs font-condensed font-semibold uppercase tracking-wider text-stone-200 border border-white/5 flex items-center gap-1.5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#c59a58]" />
                  <span className="max-w-[90px] truncate">{user.name?.split(' ')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-xl bg-[#181724] hover:bg-[#222030] text-stone-400 hover:text-rose-400 border border-white/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-condensed font-semibold uppercase tracking-wider text-stone-300 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#c59a58]" />
                <span>Login</span>
              </Link>
            )}

            <Link
              to="/booking"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#b8895b] via-[#c59a58] to-[#dfb76c] hover:from-[#a77a4d] hover:to-[#cf9f50] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Walk-In</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-[#181724] border border-white/5 text-stone-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/5 bg-[#0e0d14] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-condensed uppercase tracking-wider text-stone-300 hover:text-[#c59a58]"
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardRoute(user?.role)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#201e2c] text-xs font-condensed font-bold uppercase tracking-wider text-[#dfb76c] border border-[#c59a58]/30 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-[#c59a58]" />
                    <span>{getRoleLabel(user?.role)} ({user.name})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-condensed font-semibold uppercase tracking-wider"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#181724] text-xs font-condensed font-semibold uppercase tracking-wider text-stone-200 border border-white/10 text-center block"
                >
                  Login / Register
                </Link>
              )}

              <Link
                to="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#c59a58] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider text-center shadow-gold"
              >
                Book Walk-In Appointment
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
