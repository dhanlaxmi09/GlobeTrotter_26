import React, { useState } from 'react';
import { X, Calendar, DollarSign, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import { Trip, formatINR } from '../types/travel';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_token'>) => void;
  initialData?: Trip | null;
}

const PRESET_COVERS = [
  { label: 'Udaipur Palace', url: '/src/assets/images/hero_udaipur_palace_1792578896382.jpg' },
  { label: 'Varanasi Ghats', url: '/src/assets/images/hero_varanasi_ghats_1792578896259.jpg' },
  { label: 'Ladakh Pangong', url: '/src/assets/images/hero_ladakh_pangong_1792578896067.jpg' },
  { label: 'Kerala Backwaters', url: '/src/assets/images/hero_kerala_tea_1792578896389.jpg' },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [destinationSummary, setDestinationSummary] = useState(initialData?.destination_summary || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '2026-11-04');
  const [endDate, setEndDate] = useState(initialData?.end_date || '2026-11-10');
  const [totalBudget, setTotalBudget] = useState(initialData?.total_budget?.toString() || '75000');
  const [currency, setCurrency] = useState(initialData?.currency || 'INR');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || PRESET_COVERS[0].url);
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a journey title.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please provide valid start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    const budgetNum = parseFloat(totalBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setError('Please provide a positive total budget in Rupees (₹).');
      return;
    }

    onSubmit({
      title: title.trim(),
      destination_summary: destinationSummary.trim() || 'Custom Indian Destinations',
      start_date: startDate,
      end_date: endDate,
      total_budget: budgetNum,
      currency,
      cover_image: coverImage,
      description: description.trim(),
      is_public: initialData?.is_public ?? false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#121824] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Screen 3 · Itinerary Initialization</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white">
              {initialData ? 'Edit Journey Details' : 'Plan New Indian Journey'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Trip Name *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Royal Rajasthan & Golden Forts"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Destinations Overview</label>
            <input
              type="text"
              value={destinationSummary}
              onChange={(e) => setDestinationSummary(e.target.value)}
              placeholder="e.g. Jaipur, Udaipur, Jodhpur, Pushkar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Total Budget (INR) * {totalBudget && !isNaN(Number(totalBudget)) && (
                  <span className="text-emerald-400 font-mono">({formatINR(Number(totalBudget))})</span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-emerald-400 font-bold">₹</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="75000"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-emerald-400 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400 text-sm font-semibold"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>
          </div>

          {/* Cover Photo Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Select Indian Cover Photography</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COVERS.map((preset) => (
                <button
                  type="button"
                  key={preset.url}
                  onClick={() => setCoverImage(preset.url)}
                  className={`relative rounded-lg overflow-hidden h-16 border-2 transition-all cursor-pointer ${
                    coverImage === preset.url ? 'border-emerald-400 scale-[1.03] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/75 px-1 rounded text-white font-mono">
                    {preset.label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Trip Overview / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Focus on royal Mewar architecture, sunset boat rides on Pichola, and authentic culinary strolls."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors cursor-pointer shadow-sm"
            >
              {initialData ? 'Save Changes' : 'Initialize Indian Itinerary'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
