import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch
} from '../../services/api';

export default function ManagerBranchManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    address: '',
    city: 'Kakinada',
    state: 'Andhra Pradesh',
    phone: '',
    email: '',
    opening_time: '09:00 AM',
    closing_time: '08:00 PM',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBranches();
      setBranches(data || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err.message || 'Failed to load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || 'Kakinada',
      state: branch.state || 'Andhra Pradesh',
      phone: branch.phone || '',
      email: branch.email || '',
      opening_time: branch.opening_time || '09:00 AM',
      closing_time: branch.closing_time || '08:00 PM',
      status: branch.status || 'active'
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.phone.trim()) {
      alert('Please fill in all required fields (Name, Address, City, Phone).');
      return;
    }
    setIsSubmitting(true);
    try {
      await createBranch(formData);
      setIsAddOpen(false);
      showToast('Branch added successfully.');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    setIsSubmitting(true);
    try {
      await updateBranch(editingBranch.id, formData);
      setEditingBranch(null);
      showToast('Branch updated successfully.');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBranch) return;
    try {
      const res = await deleteBranch(deletingBranch.id);
      setDeletingBranch(null);
      showToast(res.message || 'Branch removed successfully.');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to remove branch.');
    }
  };

  const columns = [
    {
      header: 'Branch Code & ID',
      accessor: 'id',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#dfb76c]">{row.code || row.id}</span>
          <p className="text-[10px] text-stone-500 font-mono">{row.id}</p>
        </div>
      )
    },
    {
      header: 'Branch Name & City',
      accessor: 'name',
      render: (row) => (
        <div>
          <h4 className="font-bold text-white uppercase font-condensed tracking-wider">{row.name}</h4>
          <p className="text-xs text-stone-400">{row.city}, {row.state || 'AP'}</p>
        </div>
      )
    },
    {
      header: 'Address',
      accessor: 'address',
      render: (row) => (
        <span className="text-xs text-stone-300 line-clamp-1 max-w-xs">{row.address}</span>
      )
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <div className="text-xs">
          <p className="text-white font-medium">{row.phone}</p>
          <p className="text-[11px] text-stone-400">{row.email || '—'}</p>
        </div>
      )
    },
    {
      header: 'Operating Hours',
      accessor: 'opening_time',
      render: (row) => (
        <span className="text-xs text-stone-300">
          {row.opening_time} – {row.closing_time}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isActive = (row.status || '').toLowerCase() === 'active' || (row.status || '').toLowerCase() === 'open';
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-condensed font-bold uppercase tracking-wider ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            title="Edit Branch"
            className="p-2 rounded-xl bg-[#201e2c] hover:bg-[#282638] text-stone-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#c59a58]" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingBranch(row)}
            title="Deactivate / Remove Branch"
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Manager Exclusive Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Branch Management
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-2xl bg-[#1c1a26] border border-[#c59a58]/40 text-[#dfb76c] text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase tracking-wider text-sm">
          Loading Salon Branches...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={branches}
          emptyMessage="No branches found. Click 'Add New Branch' to create one."
        />
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Salon Branch"
        subtitle="Provision a new physical or concierge branch location"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. KAKINADA MAIN"
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Address *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Main Road, Near Bhanugudi Junction"
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Kakinada"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Andhra Pradesh"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98480 12345"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="branch@smartsalon.in"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Opening Time
              </label>
              <input
                type="text"
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                placeholder="10:00 AM"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Closing Time
              </label>
              <input
                type="text"
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                placeholder="08:00 PM"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-white text-xs font-condensed uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Branch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Branch Modal */}
      {editingBranch && (
        <Modal
          isOpen={Boolean(editingBranch)}
          onClose={() => setEditingBranch(null)}
          title={`Edit Branch: ${editingBranch.name}`}
          subtitle={`Branch ID: ${editingBranch.id}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58] font-condensed uppercase"
                >
                  <option value="active">Active (Online)</option>
                  <option value="inactive">Inactive (Offline)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Opening Time
                </label>
                <input
                  type="text"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                  Closing Time
                </label>
                <input
                  type="text"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-white text-xs font-condensed uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Update Branch'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingBranch)}
        onClose={() => setDeletingBranch(null)}
        onConfirm={handleConfirmDelete}
        title="Remove / Deactivate Branch"
        message={`Are you sure you want to remove '${deletingBranch?.name}'? If the branch has existing appointments or assigned stylists, it will be safely deactivated (soft-deleted) to protect historical data.`}
        confirmText="Confirm Deactivation"
        danger
      />
    </div>
  );
}
