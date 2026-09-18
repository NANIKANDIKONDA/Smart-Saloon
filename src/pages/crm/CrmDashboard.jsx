import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  IndianRupee,
  Users,
  CreditCard,
  XCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import ChartCard from '../../components/ui/ChartCard';
import DataTable from '../../components/ui/DataTable';
import { getCrmDashboard, getCrmAppointments, updateAppointmentStatus } from '../../services/api';

export default function CrmDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, appts] = await Promise.all([
        getCrmDashboard(),
        getCrmAppointments({ status_filter: 'all' })
      ]);
      setDashboardData(dash);
      setRecentAppointments(appts.slice(0, 6));
    } catch (err) {
      console.error('Failed to load CRM dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickStatusChange = async (bookingId, nextStatus) => {
    try {
      await updateAppointmentStatus(bookingId, nextStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const kpis = dashboardData?.kpis || {};
  const trend = dashboardData?.revenueTrend || [];
  const popularity = dashboardData?.servicePopularity || [];

  const columns = [
    {
      header: 'Booking ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs font-bold text-[#dfb76c]">{row.id}</span>
    },
    {
      header: 'Guest',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.customerName}</p>
          <p className="text-[11px] text-stone-400">{row.customerPhone}</p>
        </div>
      )
    },
    {
      header: 'Branch & Service',
      accessor: 'serviceName',
      render: (row) => (
        <div>
          <p className="text-stone-200">{row.serviceName}</p>
          <p className="text-[11px] text-[#c59a58] font-condensed uppercase">{row.branchName}</p>
        </div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'date',
      render: (row) => (
        <span className="text-xs text-stone-300">
          {row.date} • {row.timeSlot}
        </span>
      )
    },
    {
      header: 'Advance / Total',
      accessor: 'totalAmount',
      render: (row) => (
        <div>
          <span className="text-xs text-emerald-400 font-semibold">₹{row.advancePaid || 99} paid</span>
          <span className="text-[11px] text-stone-500 block">Total: ₹{row.totalAmount}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isCompleted = row.status === 'Completed';
        const isCancelled = row.status === 'Cancelled';
        const isCheckedIn = row.status === 'Checked-in';

        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-condensed uppercase tracking-wider font-bold ${
              isCompleted
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                : isCancelled
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                : isCheckedIn
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'Confirmed' && (
            <button
              type="button"
              onClick={() => handleQuickStatusChange(row.id, 'Checked-in')}
              className="px-2.5 py-1 rounded-lg bg-[#201e2c] hover:bg-[#282638] text-stone-200 text-[10px] font-condensed uppercase tracking-wider transition-colors"
            >
              Check-In
            </button>
          )}
          {row.status === 'Checked-in' && (
            <button
              type="button"
              onClick={() => handleQuickStatusChange(row.id, 'In Service')}
              className="px-2.5 py-1 rounded-lg bg-[#c59a58] text-neutral-950 text-[10px] font-condensed font-bold uppercase tracking-wider transition-colors"
            >
              Start Service
            </button>
          )}
          {row.status === 'In Service' && (
            <button
              type="button"
              onClick={() => handleQuickStatusChange(row.id, 'Completed')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-neutral-950 text-[10px] font-condensed font-bold uppercase tracking-wider transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      )
    }
  ];

  if (loading && !dashboardData) {
    return (
      <div className="py-20 text-center text-stone-400 font-condensed uppercase tracking-wider text-sm">
        Loading CRM Concierge Metrics...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Executive Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Salon Command Center
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/crm/appointments')}
          className="px-5 py-2 rounded-xl bg-[#1e1c2a] hover:bg-[#252335] text-stone-200 border border-white/10 text-xs font-condensed uppercase tracking-wider font-semibold flex items-center gap-2"
        >
          <span>View All Appointments</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#c59a58]" />
        </button>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Today's Bookings"
          value={kpis.todayAppointments ?? 0}
          subtitle="Reserved chairs"
          icon={Calendar}
          trend="+12%"
          trendType="positive"
        />
        <StatsCard
          title="Today's Revenue"
          value={`₹${kpis.todayRevenue ?? 0}`}
          subtitle="Advance tokens"
          icon={IndianRupee}
          trend="+8%"
          trendType="positive"
        />
        <StatsCard
          title="Total Patrons"
          value={kpis.totalCustomers ?? 0}
          subtitle="Distinct client emails"
          icon={Users}
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${kpis.totalRevenue ?? 0}`}
          subtitle="Gross advances"
          icon={TrendingUp}
        />
        <StatsCard
          title="Pending Payments"
          value={kpis.pendingPayments ?? 0}
          subtitle="At chair balance"
          icon={CreditCard}
        />
        <StatsCard
          title="Cancellations"
          value={`${kpis.cancellations ?? 0} (${kpis.cancellationRate ?? 0}%)`}
          subtitle="Slot drops"
          icon={XCircle}
          trendType="neutral"
        />
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ChartCard
            title="7-Day Revenue Trend (Advance Collections)"
            subtitle="Daily online payments processed across all branches"
            data={trend}
            valueKey="revenue"
            labelKey="day"
            barColor="#c59a58"
          />
        </div>

        <div className="lg:col-span-4 rounded-3xl bg-[#14131d] p-6 border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-wider text-white">
              Service Popularity
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">Top requested rituals</p>

            <div className="mt-6 space-y-4">
              {popularity.map((svc, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-stone-300 truncate max-w-[200px]">{svc.name}</span>
                    <span className="text-[#c59a58] font-bold">{svc.count} booked</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1e1c2a] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#c59a58] to-[#dfb76c] rounded-full"
                      style={{ width: `${Math.min(100, svc.count * 20)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Branch Slot Synchronization Active</span>
            <span className="text-emerald-400 font-bold">100% Online</span>
          </div>
        </div>
      </div>

      {/* Live Appointments Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-condensed font-bold uppercase tracking-wider text-white">
            Recent Appointments & Live Chair Status
          </h2>
          <span className="text-xs text-stone-400 font-condensed uppercase tracking-wider">
            Latest 6 Bookings
          </span>
        </div>

        <DataTable
          columns={columns}
          data={recentAppointments}
          emptyMessage="No appointments scheduled currently."
        />
      </div>
    </div>
  );
}
