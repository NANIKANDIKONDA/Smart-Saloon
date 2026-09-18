import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, IndianRupee, PieChart } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import { getCrmReports } from '../../services/api';

export default function CrmReports() {
  const [period, setPeriod] = useState('month');
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCrmReports(period)
      .then((data) => setReportsData(data))
      .catch((err) => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Business Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Analytics & Executive Reports
          </h1>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-[#14131d] border border-white/5">
          {['month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-condensed uppercase tracking-wider font-semibold transition-all ${
                period === p
                  ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              This {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && !reportsData ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
          Generating Analytics...
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Revenue"
              value={`₹${reportsData?.totalRevenue || 0}`}
              subtitle="Online advances"
              icon={IndianRupee}
            />
            <StatsCard
              title="Total Completed Bookings"
              value={reportsData?.totalBookings || 0}
              subtitle="Confirmed appointments"
              icon={Calendar}
            />
            <StatsCard
              title="Average Booking Value"
              value={`₹${reportsData?.averageBookingValue || 0}`}
              subtitle="Mean ticket size"
              icon={TrendingUp}
            />
            <StatsCard
              title="Repeat Customer Rate"
              value={`${reportsData?.repeatCustomerRate || 0}%`}
              subtitle="Customer loyalty retention"
              icon={Users}
              trend="+4.2%"
              trendType="positive"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-[#14131d] p-6 sm:p-8 border border-white/5 space-y-4">
              <h3 className="text-base font-condensed font-bold uppercase tracking-wider text-white">
                Customer Acquisition & Retention Breakdown
              </h3>
              <p className="text-xs text-stone-400">
                Analysis of first-time patrons vs recurring loyalists across the selected period.
              </p>

              <div className="pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-stone-300">Returning Loyal Guests</span>
                    <span className="text-[#c59a58] font-bold">{reportsData?.returningCustomers || 0} clients ({reportsData?.repeatCustomerRate || 0}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1e1c2a] overflow-hidden">
                    <div
                      className="h-full bg-[#c59a58] rounded-full"
                      style={{ width: `${reportsData?.repeatCustomerRate || 25}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-stone-300">New First-Time Guests</span>
                    <span className="text-stone-400 font-bold">{reportsData?.newCustomers || 0} clients</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1e1c2a] overflow-hidden">
                    <div
                      className="h-full bg-stone-500 rounded-full"
                      style={{ width: `${100 - (reportsData?.repeatCustomerRate || 25)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#14131d] p-6 sm:p-8 border border-white/5 space-y-4">
              <h3 className="text-base font-condensed font-bold uppercase tracking-wider text-white">
                Multi-Branch Performance Insights
              </h3>
              <p className="text-xs text-stone-400">
                Operational efficiency and chair utilization benchmarks.
              </p>
              <div className="pt-4 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#1a1924] border border-white/5 flex justify-between items-center">
                  <span className="text-stone-300">Badvel (Cluster 1 & 2)</span>
                  <span className="text-emerald-400 font-bold font-condensed">92% Slot Occupancy</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1924] border border-white/5 flex justify-between items-center">
                  <span className="text-stone-300">Kadapa (Central & West)</span>
                  <span className="text-emerald-400 font-bold font-condensed">88% Slot Occupancy</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1924] border border-white/5 flex justify-between items-center">
                  <span className="text-stone-300">Kodur Express</span>
                  <span className="text-emerald-400 font-bold font-condensed">84% Slot Occupancy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
