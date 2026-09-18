import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Scissors,
  CreditCard,
  BarChart3,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../components/AuthModal';

export default function CrmLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const basePath = pathname.startsWith('/admin') ? '/admin' : '/crm';
  const crmNavItems = [
    { name: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard, exact: true },
    { name: 'Appointments', path: `${basePath}/appointments`, icon: Calendar },
    { name: 'Customers 360', path: `${basePath}/customers`, icon: Users },
    { name: 'Staff Roster', path: `${basePath}/staff`, icon: UserCheck },
    { name: 'Services & Branches', path: `${basePath}/services-branches`, icon: Scissors },
    { name: 'Transactions', path: `${basePath}/payments`, icon: CreditCard },
    { name: 'Reports & KPIs', path: `${basePath}/reports`, icon: BarChart3 },
  ];

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0c0b10] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-[#14131d] border border-white/10 p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-[#1c1a26] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58] mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-condensed font-bold uppercase tracking-wider text-white">
              SmartSalon Admin Console
            </h2>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Restricted management console. Please log in with your Admin credentials to continue.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
            >
              Sign In to Admin Console
            </button>
            <Link
              to="/"
              className="block text-xs font-condensed uppercase tracking-wider text-stone-400 hover:text-white"
            >
              ← Return to Customer Website
            </Link>
          </div>
        </div>

        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0b10] text-stone-200 flex flex-col md:flex-row">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111018] border-r border-white/5 p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/crm" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c1a26] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58]">
              <Scissors className="w-4 h-4 -rotate-45" />
            </div>
            <div>
              <span className="font-condensed font-bold text-lg text-white uppercase tracking-wider block leading-none">
                SmartSalon
              </span>
              <span className="text-[10px] font-accent italic text-[#dfb76c]">
                Concierge CRM
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {crmNavItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.path : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-condensed uppercase tracking-wider font-semibold transition-all ${
                    active
                      ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                      : 'text-stone-400 hover:bg-[#1a1924] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User & Links Footer */}
        <div className="pt-6 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[#c59a58] uppercase font-condensed">{user.role}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 text-[11px] font-condensed uppercase tracking-wider text-stone-400 hover:text-[#c59a58] transition-colors pt-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Customer Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#111018]/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Nav Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-xl bg-[#1c1a26] text-stone-300 md:hidden"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-condensed uppercase tracking-wider text-stone-300 font-semibold">
                Live Operations • {user.role === 'admin' ? 'All Branches (HQ)' : (user.branch_id ? user.branch_id.toUpperCase() : 'All Branches')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-[#1e1c2a] border border-[#c59a58]/30 text-[11px] font-condensed font-bold uppercase tracking-wider text-[#dfb76c]">
              Role: {user.role.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#111018] border-b border-white/5 p-4 space-y-2">
            {crmNavItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.path : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-condensed uppercase tracking-wider font-semibold ${
                    active ? 'bg-[#c59a58] text-neutral-950 font-bold' : 'text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
              <Link to="/" className="text-[#c59a58]">Customer Site →</Link>
              <button onClick={logout} className="text-rose-400 font-bold">Logout</button>
            </div>
          </div>
        )}

        {/* Child Routes */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
