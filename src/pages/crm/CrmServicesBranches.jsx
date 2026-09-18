import React, { useState, useEffect } from 'react';
import { Scissors, MapPin, Plus, Clock, CheckCircle } from 'lucide-react';
import { getServices, getActiveBranches } from '../../services/api';
import DataTable from '../../components/ui/DataTable';

export default function CrmServicesBranches() {
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'branches'
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, bList] = await Promise.all([
        getServices(),
        getActiveBranches().catch(() => [])
      ]);
      setServices(sList);
      setBranches(bList);
    } catch (err) {
      console.error('Failed to load services and branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const branchColumns = [
    {
      header: 'Branch Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-white font-condensed uppercase text-sm">{row.name}</p>
          <p className="text-[11px] text-stone-400">{row.code}</p>
        </div>
      )
    },
    {
      header: 'Address / City',
      accessor: 'address',
      render: (row) => (
        <div>
          <p className="text-stone-300 text-xs">{row.address}</p>
          <p className="text-[11px] text-[#c59a58] font-condensed uppercase">{row.city}</p>
        </div>
      )
    },
    {
      header: 'Hours',
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
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            Catalog & Locations
          </span>
          <h1 className="text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-wider text-white">
            Services & Branches
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#14131d] border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-lg text-xs font-condensed uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'services'
                ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Services Menu ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 rounded-lg text-xs font-condensed uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'branches'
                ? 'bg-[#c59a58] text-neutral-950 font-bold shadow-gold-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Branches ({branches.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase text-sm">
          Loading Data...
        </div>
      ) : activeTab === 'services' ? (
        <DataTable columns={serviceColumns} data={services} />
      ) : (
        <DataTable columns={branchColumns} data={branches} />
      )}
    </div>
  );
}
