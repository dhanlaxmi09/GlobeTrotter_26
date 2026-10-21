import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Copy, 
  Trash2, 
  Share2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Trip, TripStop, ScheduledActivity, Expense, formatINR } from '../types/travel';
import { runTripRealityCheck } from '../services/realityCheck';

interface TripsListViewProps {
  trips: Trip[];
  stops: TripStop[];
  activities: ScheduledActivity[];
  expenses: Expense[];
  onSelectTrip: (tripId: string, tab?: string) => void;
  onCreateTrip: () => void;
  onDuplicateTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripsListView: React.FC<TripsListViewProps> = ({
  trips,
  stops,
  activities,
  expenses,
  onSelectTrip,
  onCreateTrip,
  onDuplicateTrip,
  onDeleteTrip,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'public'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = 
      trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination_summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'public') return trip.is_public;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white animate-fadeIn">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Trip Directory · Screen 4</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white">
            My Indian Journeys
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your multi-city itineraries, Rupee budget ledgers, and reality check feasibility scores.
          </p>
        </div>

        <button
          onClick={onCreateTrip}
          className="px-4 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Plan New Journey</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search trips by Rajasthan, Ladakh, Kerala, Goa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121824] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121824] border border-white/10 rounded-xl self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-emerald-400 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Journeys ({trips.length})
          </button>
          <button
            onClick={() => setFilter('public')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'public' ? 'bg-emerald-400 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Public / Shared ({trips.filter((t) => t.is_public).length})
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#121824]/60 border border-white/10 space-y-4">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-white">No journeys found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Start your first custom journey to experience smart Indian itinerary verification.'}
          </p>
          <button
            onClick={onCreateTrip}
            className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Journey</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const tripStops = stops.filter((s) => s.trip_id === trip.id);
            const tripActs = activities.filter((a) => a.trip_id === trip.id);
            const tripExps = expenses.filter((e) => e.trip_id === trip.id);

            const realityCheck = runTripRealityCheck(trip, tripStops, tripActs, tripExps);

            return (
              <div
                key={trip.id}
                className="group bg-[#121824] border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                {/* Image Banner */}
                <div 
                  onClick={() => onSelectTrip(trip.id)} 
                  className="relative h-44 overflow-hidden cursor-pointer"
                >
                  <img
                    src={trip.cover_image}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-[#121824]/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-[#0b0f17]/90 backdrop-blur-md text-[11px] font-mono font-medium text-slate-200 border border-white/10">
                      {trip.start_date}
                    </span>
                  </div>

                  {/* Reality Check Pill */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold backdrop-blur-md border ${
                      realityCheck.issues.length === 0 
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                    }`}>
                      {realityCheck.issues.length === 0 ? 'Verified 100%' : `${realityCheck.issues.length} Alerts`}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{trip.destination_summary}</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      onClick={() => onSelectTrip(trip.id)}
                      className="font-serif font-bold text-lg text-white hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {trip.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {trip.description || 'No custom notes provided.'}
                    </p>
                  </div>

                  {/* Metric Ribbon */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Stops</span>
                      <span className="font-mono font-semibold text-slate-200">{tripStops.length} cities</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Activities</span>
                      <span className="font-mono font-semibold text-slate-200">{tripActs.length} items</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Budget</span>
                      <span className="font-mono font-semibold text-emerald-400">{formatINR(trip.total_budget)}</span>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicateTrip(trip.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Duplicate Trip (Clone to My Account)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {confirmDeleteId === trip.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteTrip(trip.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-semibold rounded cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(trip.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectTrip(trip.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold text-xs hover:bg-emerald-500/25 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
