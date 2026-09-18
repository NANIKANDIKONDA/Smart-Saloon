import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Tag,
  Plus,
  X,
  Calendar,
  IndianRupee,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import {
  getCrmCustomers,
  getCustomer360,
  addCustomerNote,
  addCustomerTag,
  removeCustomerTag
} from '../../services/api';

export default function CrmCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');

  // 360 View State
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState(null);
  const [customer360Data, setCustomer360Data] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCrmCustomers(searchQuery, selectedTagFilter);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [selectedTagFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCustomers();
  };

  const handleOpenCustomer360 = async (email) => {
    setSelectedCustomerEmail(email);
    setLoading360(true);
    try {
      const details = await getCustomer360(email);
      setCustomer360Data(details);
    } catch (err) {
      console.error('Failed to load Customer 360:', err);
    } finally {
      setLoading360(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCustomerEmail) return;
    setIsSubmittingNote(true);
    try {
      await addCustomerNote(selectedCustomerEmail, newNote.trim());
      setNewNote('');
      const updated = await getCustomer360(selectedCustomerEmail);
      setCustomer360Data(updated);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim() || !selectedCustomerEmail) return;
    try {
      await addCustomerTag(selectedCustomerEmail, newTag.trim());
      setNewTag('');
      const updated = await getCustomer360(selectedCustomerEmail);
      setCustomer360Data(updated);
      loadCustomers();
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleRemoveTag = async (tagName) => {
    if (!selectedCustomerEmail) return;
    try {
      await removeCustomerTag(selectedCustomerEmail, tagName);
      const updated = await getCustomer360(selectedCustomerEmail);
      setCustomer360Data(updated);
      loadCustomers();
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  const columns = [
    {
      header: 'Customer Details',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.name}</p>
          <p className="text-[11px] text-stone-400">{row.email} • {row.phone || 'No phone'}</p>
        </div>
      )
    },
    {
      header: 'Visits',
      accessor: 'visits',
      render: (row) => (
        <span className="text-xs font-bold text-[#c59a58]">
          {row.visits} {row.visits === 1 ? 'visit' : 'visits'}
        </span>
      )
    },
    {
      header: 'Total Spend (Advance)',
      accessor: 'totalSpend',
      render: (row) => (
        <span className="text-xs font-bold text-white">
          ₹{row.totalSpend}
        </span>
      )
    },
    {
      header: 'Last Visit',
      accessor: 'lastVisit',
      render: (row) => (
        <span className="text-xs text-stone-300 font-condensed">
          {row.lastVisit}
        </span>
      )
    },
    {
      header: 'Preferred Service',
      accessor: 'preferredService',
      render: (row) => (
        <span className="text-xs text-stone-300">
          {row.preferredService || 'None'}
        </span>
      )
    },
    {
      header: 'Tags',
      accessor: 'tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            row.tags.map((t, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-[#1e1c2a] border border-[#c59a58]/30 text-[#dfb76c] text-[10px] font-condensed uppercase font-bold"
              >
                {t}
              </span>
            ))
          ) : (
            <span className="text-stone-600 text-xs">—</span>
          )}
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleOpenCustomer360(row.email)}
          className="px-3 py-1.5 rounded-lg bg-[#201e2c] hover:bg-[#282638] text-stone-200 hover:text-white text-xs font-condensed uppercase tracking-wider transition-colors"
        >
          Customer 360
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Guest Intelligence & CRM
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Customer Directory
          </h1>
        </div>
        <span className="text-xs text-stone-400 font-condensed uppercase tracking-wider">
          {customers.length} Registered Guests
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl bg-[#14131d] border border-white/5 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c59a58]"
            />
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
          </form>

          {/* Tag Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-2 sm:pb-0">
            <span className="text-[11px] font-condensed uppercase tracking-wider text-stone-500 mr-1">
              Segment:
            </span>
            {['', 'VIP', 'New', 'Regular', 'Frequent Visitor'].map((tg) => (
              <button
                key={tg}
                type="button"
                onClick={() => setSelectedTagFilter(tg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-condensed uppercase tracking-wider font-semibold transition-all ${
                  selectedTagFilter === tg
                    ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                    : 'bg-[#1c1b26] hover:bg-[#252335] text-stone-300 border border-white/5'
                }`}
              >
                {tg || 'All Guests'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase tracking-wider text-sm">
          Loading Customer Records...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          emptyMessage="No customer records found matching current query."
        />
      )}

      {/* Customer 360 Modal */}
      {selectedCustomerEmail && (
        <Modal
          isOpen={Boolean(selectedCustomerEmail)}
          onClose={() => { setSelectedCustomerEmail(null); setCustomer360Data(null); }}
          title={`Customer 360: ${customer360Data?.name || selectedCustomerEmail}`}
          subtitle={`${selectedCustomerEmail} • ${customer360Data?.phone || 'Mobile'}`}
          maxWidth="max-w-3xl"
        >
          {loading360 || !customer360Data ? (
            <div className="py-12 text-center text-stone-400 font-condensed uppercase text-xs">
              Loading 360 Profile Dossier...
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#1a1924] border border-white/5 text-center">
                <div>
                  <span className="text-[10px] font-condensed uppercase text-stone-400 block">Total Visits</span>
                  <span className="text-xl font-condensed font-bold text-white">{customer360Data.stats.totalVisits}</span>
                </div>
                <div>
                  <span className="text-[10px] font-condensed uppercase text-stone-400 block">Total Spend (Advance)</span>
                  <span className="text-xl font-condensed font-bold text-emerald-400">₹{customer360Data.stats.totalSpend}</span>
                </div>
                <div>
                  <span className="text-[10px] font-condensed uppercase text-stone-400 block">Client Tier</span>
                  <span className="text-xl font-condensed font-bold text-[#c59a58]">{customer360Data.stats.status}</span>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-condensed uppercase tracking-wider text-stone-300 font-bold">
                    Segmentation Tags
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {customer360Data.tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201e2c] border border-[#c59a58]/40 text-xs font-condensed uppercase font-bold text-[#dfb76c]"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <form onSubmit={handleAddTag} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="+ Add Tag"
                      className="bg-[#1a1924] border border-white/10 rounded-full px-3 py-1 text-xs text-white focus:outline-none focus:border-[#c59a58] w-24 font-condensed"
                    />
                  </form>
                </div>
              </div>

              {/* Notes Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-condensed uppercase tracking-wider text-stone-300 font-bold">
                  Staff Notes & Preferences
                </span>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {customer360Data.notes.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">No notes added for this customer yet.</p>
                  ) : (
                    customer360Data.notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-[#1a1924] border border-white/5 space-y-1">
                        <div className="flex justify-between text-[10px] text-stone-400">
                          <span className="font-semibold text-[#c59a58]">{n.author}</span>
                          <span>{n.date.split('T')[0]}</span>
                        </div>
                        <p className="text-xs text-stone-200">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new client note (e.g. preferred barber, beverage, allergies)..."
                    className="flex-1 bg-[#1a1924] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-4 py-2 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </form>
              </div>

              {/* Past Appointments */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-condensed uppercase tracking-wider text-stone-300 font-bold">
                  Appointment History ({customer360Data.appointments.length})
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {customer360Data.appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#161520] border border-white/5 text-xs">
                      <div>
                        <span className="font-mono text-[#dfb76c] text-[11px] font-bold mr-2">{a.id}</span>
                        <span className="text-white font-medium">{a.service}</span>
                      </div>
                      <div className="flex items-center gap-3 text-stone-400">
                        <span>{a.date} • {a.time}</span>
                        <span className="text-emerald-400 font-bold">₹{a.advancePaid}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase font-condensed">{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </Modal>
      )}

    </div>
  );
}
