import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle,
  MapPin,
  Award,
  Play,
  CheckCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCrmAppointments, updateAppointmentStatus } from '../../services/api';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    setLoading(true);
    try {
      // Load appointments for staff member's branch or assigned
      const data = await getCrmAppointments({
        date: todayStr,
        branch_id: user?.branch_id || undefined
      });
      setAppointments(data || []);
    } catch (err) {
      console.error('Failed to load staff roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.branch_id]);

  const handleStatusTransition = async (bookingId, nextStatus) => {
    setUpdatingId(bookingId);
    try {
      await updateAppointmentStatus(bookingId, nextStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0b10] text-stone-200">
      {/* Top Header */}
      <header className="h-16 bg-[#111018] border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1c1a26] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58]">
            <Scissors className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <span className="font-condensed font-bold text-base text-white uppercase tracking-wider block leading-none">
              SmartSalon
            </span>
            <span className="text-[10px] font-accent italic text-[#dfb76c]">
              Artist Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <span className="text-[10px] font-condensed uppercase text-[#c59a58]">
              {user?.branch_id ? `Branch: ${user.branch_id.toUpperCase()}` : 'Master Stylist'}
            </span>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-xl bg-[#1c1a26] hover:bg-white/5 text-stone-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Profile Card & Daily Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-3xl bg-[#14131d] border border-white/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Work Schedule • {todayStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
              Stylist Service Queue
            </h1>
            <p className="text-xs text-stone-400 max-w-xl leading-relaxed">
              Manage your daily client appointments, initiate treatments, and mark services completed.
            </p>
          </div>

          <div className="rounded-3xl bg-[#14131d] border border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1e1c2a] border border-[#c59a58]/30 flex items-center justify-center text-[#c59a58]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-condensed font-bold uppercase text-base text-white">{user?.name}</h2>
                <span className="text-[11px] text-[#dfb76c] font-condensed uppercase font-semibold">
                  Staff Role: {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-stone-400 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span>Assigned Branch:</span>
                <span className="font-mono text-white font-bold uppercase">{user?.branch_id || 'All Branches'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Daily Hours:</span>
                <span className="text-stone-300">10:00 AM – 08:00 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duty Status:</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px]">● On Duty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-condensed font-bold uppercase tracking-wider text-white">
              Today's Client Appointments ({appointments.length})
            </h2>
            <button
              onClick={loadData}
              className="text-xs font-condensed uppercase tracking-wider text-[#c59a58] hover:underline"
            >
              Refresh Queue
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
              Loading queue...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#14131d] border border-white/5 text-center space-y-2">
              <Calendar className="w-10 h-10 text-stone-500 mx-auto" />
              <p className="text-sm font-condensed uppercase tracking-wider text-stone-300">
                No appointments scheduled for today
              </p>
              <p className="text-xs text-stone-500">
                New walk-in or advance bookings will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-3xl bg-[#14131d] border border-white/5 p-6 space-y-4 hover:border-white/15 transition-all shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#dfb76c]">{a.id}</span>
                      <h3 className="font-condensed font-bold uppercase text-base text-white mt-1">
                        {a.customerName}
                      </h3>
                      <p className="text-[11px] text-stone-400">{a.customerPhone}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-condensed uppercase font-bold ${
                      a.status === 'Completed'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                        : a.status === 'In Service'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : a.status === 'Cancelled'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-300">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-[#c59a58]" />
                      <span className="font-medium text-white">{a.serviceName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#c59a58]" />
                      <span>{a.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#c59a58]" />
                      <span className="text-stone-400">{a.branchName}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    {a.status === 'Confirmed' && (
                      <button
                        type="button"
                        disabled={updatingId === a.id}
                        onClick={() => handleStatusTransition(a.id, 'In Service')}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-condensed font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Service</span>
                      </button>
                    )}

                    {a.status === 'In Service' && (
                      <button
                        type="button"
                        disabled={updatingId === a.id}
                        onClick={() => handleStatusTransition(a.id, 'Completed')}
                        className="w-full py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 font-condensed font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {(a.status === 'Completed' || a.status === 'Cancelled') && (
                      <span className="text-[11px] text-stone-500 font-condensed uppercase">
                        Ritual Concluded
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
