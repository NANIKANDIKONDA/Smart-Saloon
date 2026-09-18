import React, { useState, useEffect } from 'react';
import { CreditCard, IndianRupee, ShieldCheck, Download, Search } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import StatsCard from '../../components/ui/StatsCard';
import { getCrmPayments } from '../../services/api';

export default function CrmPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getCrmPayments()
      .then((data) => setPayments(data))
      .catch((err) => console.error('Failed to load transactions:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + (p.status === 'Captured' ? p.amount : 0), 0);
  const totalCount = payments.length;

  const filteredPayments = payments.filter((p) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (p.paymentId || '').toLowerCase().includes(term) ||
      (p.bookingId || '').toLowerCase().includes(term) ||
      (p.customerName || '').toLowerCase().includes(term) ||
      (p.method || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      header: 'Payment Reference',
      accessor: 'paymentId',
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-bold text-[#dfb76c]">{row.paymentId}</p>
          <p className="font-mono text-[10px] text-stone-500">{row.orderId}</p>
        </div>
      )
    },
    {
      header: 'Booking ID',
      accessor: 'bookingId',
      render: (row) => (
        <span className="font-mono text-xs text-stone-300 font-semibold">{row.bookingId}</span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => <span className="font-semibold text-white">{row.customerName}</span>
    },
    {
      header: 'Method',
      accessor: 'method',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full bg-[#1e1c2a] text-stone-300 text-[11px] font-condensed uppercase font-semibold">
          {row.method}
        </span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => <span className="font-bold text-emerald-400">₹{row.amount}</span>
    },
    {
      header: 'Gateway Status',
      accessor: 'status',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {row.status}
        </span>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'date',
      render: (row) => <span className="text-xs text-stone-400">{row.date}</span>
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Financial Ledger & Reconciliation
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Transactions & Razorpay Tokens
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard
          title="Total Online Advances"
          value={`₹${totalCollected}`}
          subtitle="Captured via Razorpay"
          icon={IndianRupee}
        />
        <StatsCard
          title="Total Verified Transactions"
          value={totalCount}
          subtitle="100% HMAC SHA256 Verified"
          icon={ShieldCheck}
        />
        <StatsCard
          title="Standard Advance Fee"
          value="₹99 / slot"
          subtitle="Fixed slot reservation fee"
          icon={CreditCard}
        />
      </div>

      {/* Search toolbar */}
      <div className="rounded-3xl bg-[#14131d] border border-white/5 p-4 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payment ID, booking ID, or guest..."
            className="w-full bg-[#1c1b26] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58]"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
          Loading Transactions...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayments}
          emptyMessage="No payment transactions recorded yet."
        />
      )}
    </div>
  );
}
