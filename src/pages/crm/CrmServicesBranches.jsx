import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Scissors,
  MapPin,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Edit2,
  Trash2,
  Power,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  X,
  RefreshCw,
  Building2
} from 'lucide-react';
import {
  getServices,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch
} from '../../services/api';
import DataTable from '../../components/ui/DataTable';

const DEFAULT_BRANCH_FORM = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: 'Andhra Pradesh',
  phone: '',
  email: '',
  opening_time: '09:00 AM',
  closing_time: '09:00 PM',
  working_days: 'Monday - Saturday',
  status: 'ACTIVE',
  image: ''
};

export default function CrmServicesBranches({ defaultTab = 'branches' }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location?.pathname?.endsWith('/services')) return 'services';
    if (location?.pathname?.endsWith('/branches')) return 'branches';
    return defaultTab;
  });

  useEffect(() => {
    if (location?.pathname?.endsWith('/services')) {
      setActiveTab('services');
    } else if (location?.pathname?.endsWith('/branches')) {
      setActiveTab('branches');
    }
  }, [location?.pathname]);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for branches
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Modals & notices
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_BRANCH_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteConfirmBranch, setDeleteConfirmBranch] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, bList] = await Promise.all([
        getServices().catch(() => []),
        getBranches().catch(() => [])
      ]);
      setServices(sList);
      setBranches(bList);
    } catch (err) {
      console.error('Failed to load services and branches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshBranches = async () => {
    setRefreshing(true);
    try {
      const bList = await getBranches({
        search: searchQuery,
        status: statusFilter,
        city: cityFilter
      });
      setBranches(bList);
    } catch (err) {
      console.error('Error refreshing branches:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Distinct cities for filter dropdown
  const distinctCities = useMemo(() => {
    const set = new Set();
    branches.forEach((b) => {
      if (b.city) set.add(b.city.trim());
    });
    return Array.from(set).sort();
  }, [branches]);

  // Client-side filtering as well for instantaneous response
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (b.status && b.status.toUpperCase() === statusFilter.toUpperCase());

      const matchesCity =
        cityFilter === 'ALL' ||
        (b.city && b.city.toLowerCase() === cityFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [branches, searchQuery, statusFilter, cityFilter]);

  // Modal open handlers
  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormData(DEFAULT_BRANCH_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || 'Andhra Pradesh',
      phone: branch.phone || '',
      email: branch.email || '',
      opening_time: branch.opening_time || '09:00 AM',
      closing_time: branch.closing_time || '09:00 PM',
      working_days: branch.working_days || 'Monday - Saturday',
      status: (branch.status || 'ACTIVE').toUpperCase(),
      image: branch.image || ''
    });
    setFormError('');
    setModalOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.phone.trim()) {
      setFormError('Branch name, address, city, and phone number are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, formData);
        setNotification({
          type: 'success',
          message: `Branch "${formData.name}" updated successfully.`
        });
      } else {
        await createBranch(formData);
        setNotification({
          type: 'success',
          message: `Branch "${formData.name}" added successfully.`
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save branch.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // 1-Click Activate / Deactivate Toggle
  const handleToggleStatus = async (branch) => {
    const newStatus = branch.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateBranch(branch.id, { status: newStatus });
      setNotification({
        type: 'success',
        message: `Branch "${branch.name}" is now ${newStatus}.`
      });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || `Failed to update status for ${branch.name}.`
      });
    }
  };

  // Safe Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteConfirmBranch) return;
    setDeleteLoading(true);
    try {
      const res = await deleteBranch(deleteConfirmBranch.id);
      if (res && res.soft_deleted) {
        setNotification({
          type: 'warning',
          message:
            res.message ||
            `Branch "${deleteConfirmBranch.name}" has historical bookings. It has been safely deactivated instead of deleted.`
        });
      } else {
        setNotification({
          type: 'success',
          message: `Branch "${deleteConfirmBranch.name}" permanently deleted.`
        });
      }
      setDeleteConfirmBranch(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete branch.'
      });
      setDeleteConfirmBranch(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Service table columns (unchanged)
  const serviceColumns = [
    {
      header: 'Service Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.name}</p>
          <p className="text-[11px] text-stone-400 line-clamp-1">{row.description}</p>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full bg-[#1e1c2a] text-[#c59a58] text-[11px] font-condensed uppercase font-bold">
          {row.category}
        </span>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (row) => <span className="font-bold text-white">₹{row.price}</span>
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row) => <span className="text-stone-300">{row.duration} mins</span>
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Active
        </span>
      )
    }
  ];

  // Upgraded Branch Columns with full management actions
  const branchColumns = [
    {
      header: 'Branch & Code',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white font-condensed uppercase text-sm tracking-wide">
              {row.name}
            </span>
            {row.code && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-stone-300">
                {row.code}
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">{row.id}</p>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'address',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-stone-300 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#c59a58] shrink-0" />
            <span className="truncate max-w-[200px]">{row.address}</span>
          </p>
          <p className="text-[11px] text-[#c59a58] font-condensed uppercase tracking-wider font-semibold pl-4">
            {row.city}, {row.state || 'AP'}
          </p>
        </div>
      )
    },
    {
      header: 'Operating Hours & Days',
      accessor: 'opening_time',
      render: (row) => (
        <div className="space-y-1">
          <span className="text-xs text-stone-200 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#c59a58]" />
            {row.opening_time} – {row.closing_time}
          </span>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-[#1a1926] text-stone-400 border border-white/5 font-condensed uppercase">
            {row.working_days || 'Monday - Saturday'}
          </span>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <div className="text-xs space-y-0.5 text-stone-300">
          <p className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-stone-500" />
            {row.phone}
          </p>
          {row.email && (
            <p className="flex items-center gap-1 text-[11px] text-stone-400 truncate max-w-[150px]">
              <Mail className="w-3 h-3 text-stone-500" />
              {row.email}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isActive = (row.status || '').toUpperCase() === 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => {
        const isActive = (row.status || '').toUpperCase() === 'ACTIVE';
        return (
          <div className="flex items-center gap-1.5">
            {/* Quick Activate/Deactivate */}
            <button
              type="button"
              onClick={() => handleToggleStatus(row)}
              title={isActive ? 'Deactivate Branch' : 'Activate Branch'}
              className={`p-1.5 rounded-lg border transition-all ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              title="Edit Branch Details"
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Safe Delete */}
            <button
              type="button"
              onClick={() => setDeleteConfirmBranch(row)}
              title="Delete or Safe-Deactivate Branch"
              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Catalog & Locations
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Services & Branches
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage salon services menu and multi-branch physical locations with role-enforced controls.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#14131d] border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 rounded-lg text-xs font-condensed uppercase tracking-wider font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'branches'
                ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Branches ({branches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-lg text-xs font-condensed uppercase tracking-wider font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'services'
                ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Services Menu ({services.length})
          </button>
        </div>
      </div>

      {/* Alert / Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : notification.type === 'warning'
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />}
            {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
            {notification.type === 'error' && <XCircle className="w-4 h-4 shrink-0 text-red-400" />}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Branches Tab Toolbar */}
      {activeTab === 'branches' && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111018] p-3.5 rounded-2xl border border-white/5">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch name, code, address, or city..."
              className="w-full bg-[#171622] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#171622] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-[#c59a58]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-[#171622] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-[#c59a58]"
            >
              <option value="ALL">All Cities</option>
              {distinctCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshBranches}
              disabled={refreshing}
              title="Refresh Branches"
              className="p-2 rounded-xl bg-[#171622] border border-white/10 text-stone-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#c59a58]' : ''}`} />
            </button>

            {/* Add Branch Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
          Loading Data...
        </div>
      ) : activeTab === 'services' ? (
        <DataTable columns={serviceColumns} data={services} />
      ) : (
        <div>
          {filteredBranches.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111018] border border-white/5 space-y-3">
              <Building2 className="w-8 h-8 text-stone-500 mx-auto" />
              <p className="text-stone-300 font-condensed uppercase tracking-wider text-sm">
                No branches match your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCityFilter('ALL');
                }}
                className="text-xs text-[#c59a58] underline font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <DataTable columns={branchColumns} data={filteredBranches} />
          )}
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#14131d] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
                  {editingBranch ? 'Edit Location' : 'New Location'}
                </span>
                <h3 className="text-xl font-condensed font-bold uppercase tracking-wider text-white">
                  {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Salon Branch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch Name */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. KAKINADA-MAIN"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Branch Code */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. KKD-01"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Main Road, Near Bhanugudi Junction"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Kakinada"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Andhra Pradesh"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 884 234 5678"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="kakinada@smartsalon.in"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Opening Time */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Opening Time
                  </label>
                  <input
                    type="text"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Closing Time */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Closing Time
                  </label>
                  <input
                    type="text"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    placeholder="08:00 PM"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Working Days */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Working Days
                  </label>
                  <input
                    type="text"
                    value={formData.working_days}
                    onChange={(e) => setFormData({ ...formData, working_days: e.target.value })}
                    placeholder="Monday - Saturday"
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#c59a58]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-condensed uppercase tracking-wider text-stone-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1a1926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c59a58]"
                  >
                    <option value="ACTIVE">ACTIVE (Visible to customers)</option>
                    <option value="INACTIVE">INACTIVE (Hidden from booking)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-condensed uppercase tracking-wider text-stone-300 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingBranch
                    ? 'Update Branch'
                    : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Safe Confirmation Dialog */}
      {deleteConfirmBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#14131d] border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-condensed font-bold uppercase tracking-wider text-white">
                Delete Branch
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Are you sure you want to remove{' '}
                <span className="text-[#c59a58] font-bold font-condensed uppercase">
                  {deleteConfirmBranch.name}
                </span>
                ?
              </p>
              <div className="p-3 rounded-xl bg-stone-900/60 border border-white/5 text-[11px] text-stone-400 text-left space-y-1">
                <p className="font-semibold text-stone-300">🛡️ Safe Deletion Rule:</p>
                <p>
                  If this branch has historical bookings, it will be <strong>safely deactivated</strong> (hidden from new bookings) rather than permanently deleted, ensuring customer booking history remains intact.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmBranch(null)}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-condensed uppercase tracking-wider text-stone-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-condensed uppercase tracking-wider font-bold shadow-lg shadow-red-950/50 transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
