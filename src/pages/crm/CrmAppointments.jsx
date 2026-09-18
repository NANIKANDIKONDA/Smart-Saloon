import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Scissors,
  ArrowUpDown,
  Edit2
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { getCrmAppointments, updateAppointmentStatus, getActiveBranches } from '../../services/api';

const STATUS_OPTIONS = [
  'Booked',
  'Confirmed',
  'Checked-in',
  'In Service',
  'Completed',
  'Cancelled',
  'No-show'
];

export default function CrmAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [editStatus, setEditStatus] = useState('Confirmed');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, branchList] = await Promise.all([
        getCrmAppointments({
          branch_id: selectedBranch,
          status_filter: selectedStatus,
          date: selectedDate,
          search: searchQuery
        }),
        getActiveBranches().catch(() => [])
      ]);
      setAppointments(appts);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(handler);
  }, [selectedBranch, selectedStatus, selectedDate, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenEdit = (booking) => {
    setEditingBooking(booking);
    setEditStatus(booking.status);
    setEditPaymentStatus(booking.paymentStatus);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsUpdating(true);
    try {
      await updateAppointmentStatus(editingBooking.id, editStatus, editPaymentStatus);
      setEditingBooking(null);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      header: 'Booking ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs font-bold text-[#dfb76c]">{row.id}</span>
    },
    {
      header: 'Customer Details',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.customerName}</p>
          <p className="text-[11px] text-stone-400">{row.customerPhone} • {row.customerEmail}</p>
        </div>
      )
    },
    {
      header: 'Branch & Stylist',
      accessor: 'branchName',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#c59a58]/15 text-[#dfb76c] border border-[#c59a58]/30">
              {row.branchId ? row.branchId.toUpperCase() : 'BRANCH'}
            </span>
            <span className="text-xs text-white font-condensed uppercase font-semibold">{row.branchName}</span>
          </div>
          <p className="text-[11px] text-[#c59a58]">Stylist: {row.staffName}</p>
        </div>
      )
    },
    {
      header: 'Ritual / Service',
      accessor: 'serviceName',
      render: (row) => (
        <span className="text-xs text-stone-200 font-medium">{row.serviceName}</span>
      )
    },
    {
      header: 'Date & Slot',
      accessor: 'date',
      render: (row) => (
        <span className="text-xs text-stone-300">
          {row.date} • {row.timeSlot}
        </span>
      )
    },
    {
      header: 'Financials',
      accessor: 'totalAmount',
      render: (row) => (
        <div>
          <p className="text-xs text-white font-bold">Total: ₹{row.totalAmount}</p>
          <p className="text-[10px] text-emerald-400">Advance: ₹{row.advancePaid}</p>
          <p className="text-[10px] text-stone-400">Due: ₹{row.balanceDue}</p>
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
        const isInService = row.status === 'In Service';

        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-condensed uppercase tracking-wider font-bold ${
              isCompleted
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                : isCancelled
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                : isCheckedIn
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                : isInService
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      render: (row) => (
        <span className="text-xs font-condensed uppercase font-semibold text-stone-300">
          {row.paymentStatus}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleOpenEdit(row)}
          className="p-2 rounded-xl bg-[#201e2c] hover:bg-[#282638] text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-condensed uppercase tracking-wider"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#c59a58]" />
          <span>Edit</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Appointment Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Appointment Roster
          </h1>
        </div>
        <div className="text-xs text-stone-400 font-condensed uppercase tracking-wider">
          {appointments.length} Total Matched Records
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl bg-[#14131d] border border-white/5 p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Branch Filter */}
          <div>
            <label className="block text-[10px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Filter by Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58] font-condensed uppercase"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58] font-condensed uppercase"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-[10px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Search Client / ID
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, phone, or SS-..."
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58]"
              />
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
            </form>
          </div>

        </div>

        {/* Clear Filters helper */}
        {(selectedBranch !== 'all' || selectedStatus !== 'all' || selectedDate || searchQuery) && (
          <div className="flex justify-end pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('all');
                setSelectedStatus('all');
                setSelectedDate('');
                setSearchQuery('');
              }}
              className="text-xs text-[#c59a58] hover:underline font-condensed uppercase tracking-wider"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase tracking-wider text-sm">
          Loading Appointment Records...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={appointments}
          emptyMessage="No appointments found matching current filter parameters."
        />
      )}

      {/* Edit Status Modal */}
      {editingBooking && (
        <Modal
          isOpen={Boolean(editingBooking)}
          onClose={() => setEditingBooking(null)}
          title={`Update Appointment: ${editingBooking.id}`}
          subtitle={`Guest: ${editingBooking.customerName} (${editingBooking.date} • ${editingBooking.timeSlot})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Appointment Lifecycle Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Payment Status
              </label>
              <select
                value={editPaymentStatus}
                onChange={(e) => setEditPaymentStatus(e.target.value)}
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial (Advance Paid)</option>
                <option value="Paid">Paid in Full</option>
                <option value="Refunded">Refunded</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="p-3 bg-[#181724] rounded-xl text-xs space-y-1 text-stone-400">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="text-white font-bold">₹{editingBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Advance Paid:</span>
                <span className="text-emerald-400 font-bold">₹{editingBooking.advancePaid}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining at Salon:</span>
                <span className="text-[#c59a58] font-bold">₹{editingBooking.balanceDue}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-3 px-4 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

    </div>
  );
}
