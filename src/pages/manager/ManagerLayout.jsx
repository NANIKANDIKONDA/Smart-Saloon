import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Scissors,
  Building2,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ManagerLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const managerNavItems = [
    { name: 'Overview', path: '/manager/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Appointments', path: '/manager/appointments', icon: Calendar },
    { name: 'Staff Roster', path: '/manager/staff', icon: UserCheck },
    { name: 'Customers 360', path: '/manager/customers', icon: Users },
    { name: 'Services', path: '/manager/services', icon: Scissors },
    { name: 'Branch Management', path: '/manager/branches', icon: Building2, highlight: true },
  ];

  return (
    <div className="min-h-screen bg-[#0c0b10] text-stone-200 flex flex-col md:flex-row">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111018] border-r border-white/5 p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/manager/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c1a26] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58]">
              <Scissors className="w-4 h-4 -rotate-45" />
            </div>
            <div>
              <span className="font-condensed font-bold text-lg text-white uppercase tracking-wider block leading-none">
                SmartSalon
              </span>
              <span className="text-[10px] font-accent italic text-[#dfb76c]">
                Manager Console
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {managerNavItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.path : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-condensed uppercase tracking-wider font-semibold transition-all ${
                    active
                      ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                      : 'text-stone-400 hover:bg-[#1a1924] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.highlight && !active && (
                    <span className="w-2 h-2 rounded-full bg-[#c59a58] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="pt-6 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-[#c59a58] uppercase font-condensed font-bold">Role: Manager</p>
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
                Live Operations • Manager Console ({user?.branch_id ? user.branch_id.toUpperCase() : 'HQ'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-[#1e1c2a] border border-[#c59a58]/30 text-[11px] font-condensed font-bold uppercase tracking-wider text-[#dfb76c]">
              Role: MANAGER
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#111018] border-b border-white/5 p-4 space-y-2">
            {managerNavItems.map((item) => {
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

        {/* Main Content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
