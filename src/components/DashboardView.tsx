import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  Clock, 
  Layers 
} from 'lucide-react';
import { Trip, TripStop, ScheduledActivity, Expense, UserProfile, CityCatalogItem, formatINR } from '../types/travel';
import { runTripRealityCheck } from '../services/realityCheck';

interface DashboardViewProps {
  currentUser: UserProfile;
  trips: Trip[];
  stops: TripStop[];
  activities: ScheduledActivity[];
  expenses: Expense[];
  cities: CityCatalogItem[];
  onSelectTrip: (tripId: string, initialTab?: string) => void;
  onCreateTrip: () => void;
  onExploreCities: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  trips,
  stops,
  activities,
  expenses,
  cities,
  onSelectTrip,
  onCreateTrip,
  onExploreCities,
}) => {
  const [selectedCircuit, setSelectedCircuit] = useState<string>('all');

  // Primary upcoming trip (e.g. Rajasthan Heritage)
  const primaryTrip = trips[0] || null;

  // Run Reality Check on the primary trip
  const primaryStops = primaryTrip ? stops.filter((s) => s.trip_id === primaryTrip.id) : [];
  const primaryActivities = primaryTrip ? activities.filter((a) => a.trip_id === primaryTrip.id) : [];
  const primaryExpenses = primaryTrip ? expenses.filter((e) => e.trip_id === primaryTrip.id) : [];

  const realityCheck = primaryTrip 
    ? runTripRealityCheck(primaryTrip, primaryStops, primaryActivities, primaryExpenses) 
    : null;

  const totalDestinationsCount = stops.length;
  const totalActivitiesCount = activities.length;
  const totalSpentAll = expenses.reduce((s, e) => s + e.amount, 0) + activities.reduce((s, a) => s + a.cost, 0);

  const circuits = [
    { id: 'all', label: 'All Destinations' },
    { id: 'rajasthan', label: 'Rajasthan Royal' },
    { id: 'ladakh', label: 'Himalayan Ladakh' },
    { id: 'kerala', label: 'Kerala Backwaters' },
    { id: 'varanasi', label: 'Varanasi Ghats' },
    { id: 'goa', label: 'Goa Coastal' },
  ];

  const filteredCities = cities.filter((c) => {
    if (selectedCircuit === 'all') return true;
    const text = `${c.city_name} ${c.country} ${c.description}`.toLowerCase();
    return text.includes(selectedCircuit);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white animate-fadeIn">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Namaste, Traveler Command Hub · Screen 2</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mt-1">
            Welcome back, {currentUser.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            You have <strong className="text-slate-200">{trips.length} active Indian journeys</strong> planned across {totalDestinationsCount} destinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExploreCities}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-medium text-slate-200 transition-colors cursor-pointer"
          >
            Explore India Catalog
          </button>
          <button
            onClick={onCreateTrip}
            className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Plan New Trip</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (Tabular figures, Indian Rupee format) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Trips</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-2 tabular-nums">
            {trips.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Saved in local relational DB</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total City Stops</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-2 tabular-nums">
            {totalDestinationsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Jaipur, Udaipur, Munnar, Leh, Goa</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Scheduled Activities</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-2 tabular-nums">
            {totalActivitiesCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Linked to daily timelines</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Est. Capital Planned</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-2 tabular-nums">
            {formatINR(totalSpentAll, { compact: true })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Indian Rupees ({formatINR(totalSpentAll)})</span>
        </div>
      </div>

      {/* Spotlight: Active Upcoming Trip & Live Reality Check Banner */}
      {primaryTrip && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-white">Next Upcoming Journey</h2>
              <p className="text-xs text-slate-400">Featured itinerary ready for travel</p>
            </div>
            <button
              onClick={() => onSelectTrip(primaryTrip.id)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Trip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 cols: Trip Showcase Card */}
            <div className="lg:col-span-7 bg-[#121824] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="relative h-48 sm:h-64 overflow-hidden">
                <img
                  src={primaryTrip.cover_image}
                  alt={primaryTrip.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-[#121824]/40 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-md bg-[#0b0f17]/90 backdrop-blur-md text-emerald-400 text-xs font-mono font-semibold border border-white/10">
                    {primaryTrip.start_date} → {primaryTrip.end_date}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    {primaryTrip.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{primaryTrip.destination_summary}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {primaryTrip.description}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Allocated Budget</span>
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {formatINR(primaryTrip.total_budget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Planned Activities</span>
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {primaryActivities.length} items
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Stops & Cities</span>
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {primaryStops.length} stops
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => onSelectTrip(primaryTrip.id, 'itinerary')}
                    className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors cursor-pointer shadow-sm"
                  >
                    Open Itinerary Builder
                  </button>
                  <button
                    onClick={() => onSelectTrip(primaryTrip.id, 'timeline')}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                  >
                    View Timeline
                  </button>
                  <button
                    onClick={() => onSelectTrip(primaryTrip.id, 'budget')}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                  >
                    Budget Breakdown
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Trip Reality Check Live Console */}
            <div className="lg:col-span-5 bg-[#121824] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Trip Reality Check</h3>
                      <span className="text-[11px] text-slate-400">Algorithmic Feasibility Engine</span>
                    </div>
                  </div>
                  
                  {realityCheck && (
                    <div className="text-right">
                      <span className={`text-base font-mono font-bold tabular-nums ${
                        realityCheck.feasibilityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {realityCheck.feasibilityScore}/100
                      </span>
                      <span className="block text-[10px] text-slate-400">Score</span>
                    </div>
                  )}
                </div>

                {/* Reality Check Alerts */}
                <div className="mt-4 space-y-3">
                  {realityCheck && realityCheck.issues.length > 0 ? (
                    <>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-amber-300">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{realityCheck.issues.length} Issues Detected</span>
                        </div>
                        <p className="text-slate-300 mt-1 text-[11px]">
                          {realityCheck.issues[0].title}
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        {realityCheck.issues.slice(0, 2).map((issue) => (
                          <div key={issue.id} className="p-2.5 rounded-lg bg-[#0b0f17] border border-white/5 space-y-1">
                            <span className="font-medium text-slate-200 text-[11px] block truncate">
                              • {issue.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {issue.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold block">Indian Itinerary Verified</span>
                        <span className="text-[11px] text-slate-400">Zero transit collisions or budget overruns.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => onSelectTrip(primaryTrip.id, 'reality_check')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Open Reality Check Console & 1-Click Fixes</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Recommended Destinations Carousel Strip with Circuit Filtering */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-white">Explore Indian Destinations</h2>
            <p className="text-xs text-slate-400">Curated heritage spots ready to add to your journeys</p>
          </div>
          <button
            onClick={onExploreCities}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View All ({cities.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Circuit Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {circuits.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCircuit(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCircuit === c.id
                  ? 'bg-emerald-400 text-slate-950 font-semibold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCities.slice(0, 4).map((city) => (
            <div
              key={city.id}
              onClick={onExploreCities}
              className="group bg-[#121824] border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={city.image_url}
                  alt={city.city_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs font-mono font-semibold text-emerald-300">
                  {formatINR(city.avg_daily_budget)} / day
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-serif font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                  {city.city_name}
                </h4>
                <span className="text-xs text-slate-400 block">{city.country}</span>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                  {city.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
