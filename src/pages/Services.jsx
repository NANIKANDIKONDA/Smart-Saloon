import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import ServiceCard from '../components/ui/ServiceCard';
import BookingSummaryBar from '../components/ui/BookingSummaryBar';
import EmptyState from '../components/ui/EmptyState';
import { getServices } from '../services/api';

const CATEGORIES = ['All', 'Hair', 'Skin', 'Beauty', 'Therapy', 'Packages'];

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-asc' | 'price-desc' | 'duration'
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getServices()
      .then((data) => setServices(data))
      .catch((err) => setError(err.message || 'Unable to load treatments.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleService = (service) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(service.id)) {
        next.delete(service.id);
      } else {
        next.add(service.id);
      }
      return next;
    });
  };

  // Filter & Sort
  const filteredServices = services
    .filter((s) => {
      const matchesCategory = selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'duration') return a.duration - b.duration;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  // Calculate totals of selected items
  const selectedServicesList = services.filter((s) => selectedServiceIds.has(s.id));
  const totalAmount = selectedServicesList.reduce((acc, s) => acc + s.price, 0);

  const handleContinueToBooking = () => {
    navigate('/booking', {
      state: {
        preSelectedServiceIds: Array.from(selectedServiceIds)
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-36">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block">
          The Treatment Catalogue
        </span>
        <h1 className="text-3xl sm:text-5xl font-condensed font-bold uppercase tracking-wider text-white">
          Services & Bespoke Rituals
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 font-light">
          Select one or multiple services below. Your selection is preserved as you proceed directly to chair reservation.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-condensed uppercase tracking-wider font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#c59a58] text-neutral-950 shadow-gold font-bold scale-105'
                      : 'bg-[#14131d] hover:bg-[#1a1926] text-stone-300 border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatments..."
                className="w-full bg-[#14131d] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#c59a58]"
              />
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-4 top-3" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#14131d] border border-white/10 rounded-full px-4 py-2 text-xs text-stone-300 focus:outline-none focus:border-[#c59a58] font-condensed uppercase tracking-wider cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 font-condensed uppercase tracking-wider text-sm">
          Loading Luxury Catalogue...
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No Services Found"
          description="We couldn't find any treatments matching your current search or category."
          actionLabel="Reset Filters"
          onAction={() => { setSelectedCategory('All'); setSearchQuery(''); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedServiceIds.has(service.id)}
              onToggle={handleToggleService}
            />
          ))}
        </div>
      )}

      {/* Floating Sticky Bottom Bar (Matching Screenshot 3) */}
      <BookingSummaryBar
        selectedCount={selectedServiceIds.size}
        totalPrice={totalAmount}
        onContinue={handleContinueToBooking}
        continueLabel="CONTINUE TO BOOKING"
      />
    </div>
  );
}
