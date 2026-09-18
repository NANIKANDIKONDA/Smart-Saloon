import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Clock, ShieldCheck, ArrowRight, MapPin, CheckCircle, Home as HomeIcon } from 'lucide-react';
import Hero from '../components/ui/Hero';
import BranchCard from '../components/ui/BranchCard';
import ServiceCard from '../components/ui/ServiceCard';
import Modal from '../components/ui/Modal';
import { getActiveBranches, getServices } from '../services/api';

export default function Home({ onOpenChat }) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeServiceModalOpen, setHomeServiceModalOpen] = useState(false);
  const [homeCity, setHomeCity] = useState('Badvel');
  const [homeAddress, setHomeAddress] = useState('');

  useEffect(() => {
    Promise.all([getActiveBranches(), getServices()])
      .then(([branchesData, servicesData]) => {
        setBranches(branchesData.slice(0, 6));
        setFeaturedServices(servicesData.filter((s) => s.featured).slice(0, 6));
      })
      .catch((err) => console.error('Error loading home data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectBranch = (branch) => {
    navigate('/booking', { state: { preSelectedBranchId: branch.id } });
  };

  const handleToggleService = (service) => {
    navigate('/booking', { state: { preSelectedServiceId: service.id } });
  };

  const handleProceedHomeService = (e) => {
    e.preventDefault();
    setHomeServiceModalOpen(false);
    navigate('/booking', {
      state: {
        bookingType: 'home_service',
        location: `${homeAddress}, ${homeCity}`
      }
    });
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. Hero Section */}
      <Hero
        onOpenChat={onOpenChat}
        onSelectHomeService={() => setHomeServiceModalOpen(true)}
      />

      {/* 2. Branches Showcase (Matching Screenshot 1 aesthetic) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Select Your Destination</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-condensed font-bold uppercase tracking-wider text-white">
            Choose Your Nearest Branch
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-light max-w-lg mx-auto">
            Live availability synced across our exclusive sanctuaries in Badvel, Kadapa, Kodur, and Kakinada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onSelect={handleSelectBranch}
            />
          ))}
        </div>
      </section>

      {/* 3. Featured Services Catalogue (Matching Screenshots 2 & 3 aesthetic) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <span className="text-xs font-condensed uppercase tracking-widest text-[#c59a58] font-bold block mb-1">
              Curated Treatments
            </span>
            <h2 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-wider text-white">
              Signature Services
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="px-6 py-2.5 rounded-full bg-[#181724] hover:bg-[#222030] text-stone-200 border border-[#c59a58]/30 font-condensed font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-all hover:text-[#dfb76c]"
          >
            <span>Explore Full Menu</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#c59a58]" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onToggle={handleToggleService}
            />
          ))}
        </div>
      </section>

      {/* 4. Luxury Experience Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#13121b] border border-white/5 p-8 sm:p-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
              Zero Wait Walk-In
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Real-time branch slot synchronization guarantees your reserved styling chair upon arrival.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
              Secured Advance Token
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Reserve with a small ₹99 advance via Razorpay; complete the remainder comfortably at the salon.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1c1a26] border border-white/5 flex items-center justify-center text-[#c59a58]">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-condensed font-bold uppercase tracking-wider text-white">
              Master Craftsmanship
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Experienced barbers, colorists, and skin aestheticians trained in contemporary aesthetics.
            </p>
          </div>
        </div>
      </section>

      {/* Home Service Modal */}
      <Modal
        isOpen={homeServiceModalOpen}
        onClose={() => setHomeServiceModalOpen(false)}
        title="Book Home Salon Service"
        subtitle="Our master stylists bring the luxury studio experience right to your doorstep"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleProceedHomeService} className="space-y-4">
          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Select City
            </label>
            <select
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            >
              <option value="Badvel">Badvel</option>
              <option value="Kadapa">Kadapa</option>
              <option value="Kodur">Kodur</option>
              <option value="Kakinada">Kakinada</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-condensed uppercase tracking-wider text-stone-400 mb-1">
              Residential Address / Door No.
            </label>
            <textarea
              required
              rows={3}
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="Apartment, Street, Landmark..."
              className="w-full bg-[#1c1b26] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c59a58]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#b8895b] via-[#c59a58] to-[#dfb76c] text-neutral-950 font-condensed font-bold text-sm uppercase tracking-wider shadow-gold transition-all flex items-center justify-center gap-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Select Treatments for Home Visit</span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
