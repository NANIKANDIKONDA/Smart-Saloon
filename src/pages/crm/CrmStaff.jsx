import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Phone, Mail, MapPin, Clock, Award } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { getCrmStaff, createCrmStaff, getActiveBranches } from '../../services/api';

export default function CrmStaff() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Barber',
    branch_id: 'badvel-1',
    specialization: 'Precision Haircut & Beard Sculpting',
    working_hours: '10:00 AM - 08:00 PM',
    status: 'Available'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffList, branchList] = await Promise.all([
        getCrmStaff(),
        getActiveBranches().catch(() => [])
      ]);
      setStaff(staffList);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load staff roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCrmStaff(form);
      setIsModalOpen(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        role: 'Barber',
        branch_id: 'badvel-1',
        specialization: '',
        working_hours: '10:00 AM - 08:00 PM',
        status: 'Available'
      });
      loadData();
    } catch (err) {
      console.error('Failed to create staff member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [selectedBranch, setSelectedBranch] = useState('all');

  const branchMap = branches.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {});
  const filteredStaff = selectedBranch === 'all'
    ? staff
    : staff.filter((s) => s.branch_id === selectedBranch);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Human Resources & Artists
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Staff & Stylists Roster
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold text-xs uppercase tracking-wider shadow-gold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Stylist / Staff</span>
        </button>
      </div>

      {/* Branch Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#14131d] border border-white/5">
        <div className="flex items-center gap-3">
          <label className="text-xs font-condensed uppercase tracking-wider text-stone-400">
            Filter by Branch:
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58] font-condensed uppercase"
          >
            <option value="all">All Branches ({staff.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({staff.filter((s) => s.branch_id === b.id).length})
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-stone-400 font-condensed uppercase tracking-wider">
          Showing {filteredStaff.length} Artists
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
          Loading Staff Roster...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
          No stylists assigned to this branch yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((st) => (
            <div
              key={st.id}
              className="rounded-3xl bg-[#14131d] border border-white/5 p-6 space-y-4 hover:border-white/15 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
                    {st.name}
                  </h3>
                  <span className="text-xs text-[#c59a58] font-condensed uppercase font-semibold">
                    {st.role} • {branchMap[st.branch_id] || st.branch_id}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-condensed uppercase font-bold">
                  {st.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-[#c59a58]" />
                  <span>{st.specialization || 'General Styling'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#c59a58]" />
                  <span>{st.working_hours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>{st.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Stylist / Staff Member"
        subtitle="Roster details directly influence booking slot availability calculations"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Anand Varma"
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              >
                <option value="Barber">Barber</option>
                <option value="Stylist">Stylist</option>
                <option value="Therapist">Therapist</option>
                <option value="Manager">Manager</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Assigned Branch *
              </label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@smartsalon.in"
                className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c59a58]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Specialization / Expertise
            </label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              placeholder="e.g. Master Fade, Beard Styling, Skin Detoxing"
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-condensed font-bold uppercase text-xs tracking-wider shadow-gold transition-all"
          >
            {isSubmitting ? 'Saving...' : 'Add Stylist'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
