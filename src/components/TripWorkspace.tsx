import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Trash2, 
  Edit3, 
  Share2, 
  Layers, 
  Sparkles, 
  MoveUp, 
  MoveDown,
  ExternalLink,
  Copy,
  Check,
  TrendingDown,
  Info,
  List,
  CalendarDays,
  Train,
  Globe,
  RefreshCw
} from 'lucide-react';
import { 
  Trip, 
  TripStop, 
  ScheduledActivity, 
  Expense, 
  RealityCheckIssue, 
  ActivityCategory, 
  ExpenseCategory,
  RealityCheckFix,
  formatINR,
  OsmAttraction,
  OsmAttractionCategory,
  DestinationGeoInfo
} from '../types/travel';
import { runTripRealityCheck } from '../services/realityCheck';
import { 
  geocodeDestination, 
  fetchOverpassPOIs, 
  getDemoFallbackPOIs 
} from '../services/overpassService';

interface TripWorkspaceProps {
  trip: Trip;
  stops: TripStop[];
  activities: ScheduledActivity[];
  expenses: Expense[];
  onBack: () => void;
  onUpdateTrip: (updates: Partial<Trip>) => void;
  onCreateStop: (stopData: Omit<TripStop, 'id'>) => void;
  onUpdateStop: (stopId: string, updates: Partial<TripStop>) => void;
  onDeleteStop: (stopId: string) => void;
  onReorderStops: (stopIds: string[]) => void;
  onCreateActivity: (activityData: Omit<ScheduledActivity, 'id'>) => void;
  onUpdateActivity: (actId: string, updates: Partial<ScheduledActivity>) => void;
  onDeleteActivity: (actId: string) => void;
  onCreateExpense: (expenseData: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expId: string) => void;
  onApplyRealityFix: (fix: RealityCheckFix) => void;
  onDuplicateTrip: () => void;
  onOpenPublicView: (shareToken: string) => void;
  initialTab?: string;
}

export const TripWorkspace: React.FC<TripWorkspaceProps> = ({
  trip,
  stops,
  activities,
  expenses,
  onBack,
  onUpdateTrip,
  onCreateStop,
  onUpdateStop,
  onDeleteStop,
  onReorderStops,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  onCreateExpense,
  onDeleteExpense,
  onApplyRealityFix,
  onDuplicateTrip,
  onOpenPublicView,
  initialTab = 'itinerary',
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [itineraryViewMode, setItineraryViewMode] = useState<'list' | 'calendar'>('list');
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Stop State
  const [newCityName, setNewCityName] = useState('');
  const [newCountry, setNewCountry] = useState('India');
  const [newArrival, setNewArrival] = useState(trip.start_date);
  const [newDeparture, setNewDeparture] = useState(trip.end_date);
  const [newLodging, setNewLodging] = useState('');
  const [newLodgingCost, setNewLodgingCost] = useState('0');

  // New Activity State
  const [newActTitle, setNewActTitle] = useState('');
  const [newActCategory, setNewActCategory] = useState<ActivityCategory>('Sightseeing');
  const [newActDate, setNewActDate] = useState(trip.start_date);
  const [newActStartTime, setNewActStartTime] = useState('10:00');
  const [newActEndTime, setNewActEndTime] = useState('11:30');
  const [newActCost, setNewActCost] = useState('0');
  const [newActZone, setNewActZone] = useState('');
  const [newActStopId, setNewActStopId] = useState(stops[0]?.id || '');
  const [newActOptional, setNewActOptional] = useState(false);

  // New Expense State
  const [newExpCategory, setNewExpCategory] = useState<ExpenseCategory>('Transport');
  const [newExpAmount, setNewExpAmount] = useState('2500');
  const [newExpDate, setNewExpDate] = useState(trip.start_date);
  const [newExpDesc, setNewExpDesc] = useState('');

  // OpenStreetMap Explorer Modal State
  const [isOsmDrawerOpen, setIsOsmDrawerOpen] = useState(false);
  const [osmQuery, setOsmQuery] = useState(stops[0]?.city_name || trip.destination_summary.split(',')[0].trim() || 'Mysore');
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmAttractions, setOsmAttractions] = useState<OsmAttraction[]>([]);
  const [osmGeoInfo, setOsmGeoInfo] = useState<DestinationGeoInfo | null>(null);
  const [osmCategoryFilter, setOsmCategoryFilter] = useState<OsmAttractionCategory>('All');
  const [osmErrorMsg, setOsmErrorMsg] = useState<string | null>(null);
  const [osmSelectedDate, setOsmSelectedDate] = useState(trip.start_date);
  const [osmSelectedTime, setOsmSelectedTime] = useState('11:00');

  const handleSearchWorkspaceOsm = async (queryToSearch: string, forceFallback = false) => {
    const q = queryToSearch.trim();
    if (!q) return;
    setOsmLoading(true);
    setOsmErrorMsg(null);

    try {
      if (forceFallback) {
        setOsmGeoInfo({
          query: q,
          displayName: `${q}, India`,
          city: q,
          country: 'India',
          lat: 26.9124,
          lon: 75.7873
        });
        setOsmAttractions(getDemoFallbackPOIs(q));
        setOsmLoading(false);
        return;
      }

      const geo = await geocodeDestination(q);
      if (!geo) {
        setOsmErrorMsg(`Could not find "${q}" on OpenStreetMap.`);
        setOsmAttractions([]);
        setOsmLoading(false);
        return;
      }
      setOsmGeoInfo(geo);
      const res = await fetchOverpassPOIs(geo.lat, geo.lon, 15000);
      if (res.attractions.length > 0) {
        setOsmAttractions(res.attractions);
      } else {
        setOsmAttractions([]);
        setOsmErrorMsg(res.error || `No mapped attractions found for "${geo.city}" on OSM.`);
      }
    } catch (err: any) {
      setOsmErrorMsg(err.message || 'Error querying OpenStreetMap.');
      setOsmAttractions([]);
    } finally {
      setOsmLoading(false);
    }
  };

  // Run Reality Check
  const realityCheck = runTripRealityCheck(trip, stops, activities, expenses);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFixClick = (fix: RealityCheckFix) => {
    onApplyRealityFix(fix);
    showToast(`Fix Applied: ${fix.label}`);
  };

  // Group activities by date
  const datesInRange: string[] = [];
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    datesInRange.push(d.toISOString().split('T')[0]);
  }

  // Cost calculations
  const activitiesTotal = activities.reduce((s, a) => s + (a.cost || 0), 0);
  const expensesTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCost = activitiesTotal + expensesTotal;
  const remainingBudget = trip.total_budget - totalCost;

  // Budget category breakdown
  const categoryTotals: Record<string, number> = {
    Transport: 0,
    Accommodation: 0,
    Food: 0,
    Activities: activitiesTotal,
    Miscellaneous: 0,
  };
  expenses.forEach((e) => {
    if (categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += e.amount;
    } else {
      categoryTotals[e.category] = e.amount;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-white animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Journeys</span>
          </button>
          
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {trip.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              {trip.start_date} → {trip.end_date}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{trip.destination_summary || 'No stops added'}</span>
            <span className="text-white/20">·</span>
            <span>Allocated: <strong className="text-white font-mono">{formatINR(trip.total_budget)}</strong></span>
            <span className="text-white/20">·</span>
            <span>Est. Spend: <strong className={`font-mono ${totalCost > trip.total_budget ? 'text-rose-400' : 'text-emerald-400'}`}>{formatINR(totalCost)}</strong></span>
          </div>
        </div>

        {/* Reality Check Score Pill in Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('reality_check')}
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
              realityCheck.issues.length === 0
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <div className="text-left text-xs">
              <span className="font-semibold block">Reality Score: {realityCheck.feasibilityScore}%</span>
              <span className="text-[10px] text-slate-400">
                {realityCheck.issues.length === 0 ? 'Verified 100%' : `${realityCheck.issues.length} Issues To Fix`}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Share & Export"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Single line, active state) */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'itinerary' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Itinerary & Route ({stops.length} stops)
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'timeline' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Timeline & Calendar Grid
        </button>
        <button
          onClick={() => setActiveTab('reality_check')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reality_check' 
              ? 'bg-emerald-400 text-slate-950 font-bold' 
              : realityCheck.issues.length > 0 
                ? 'text-amber-400 hover:text-amber-300' 
                : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Trip Reality Check ({realityCheck.issues.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'budget' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Budget Ledger ({formatINR(totalCost)})
        </button>
        <button
          onClick={() => setActiveTab('share')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'share' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Share & Publish
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ITINERARY BUILDER & ITINERARY VIEW (Screens 5 & 6) */}
      {/* ========================================================================= */}
      {activeTab === 'itinerary' && (
        <div className="space-y-8">
          
          {/* City Stops Bar (Screen 5: Itinerary Builder) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Route & City Stops · Screen 5</h3>
                <span className="text-xs text-slate-400">Order of travel, intercity corridors, and lodging</span>
              </div>
              <button
                onClick={() => setIsAddStopOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add City Stop</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="p-4 rounded-xl bg-[#121824] border border-white/10 space-y-2 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                        Stop #{stop.stop_order} · {stop.country}
                      </span>
                      <h4 className="font-serif font-bold text-white text-base">
                        {stop.city_name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          onClick={() => {
                            const newOrder = [...stops];
                            const temp = newOrder[idx - 1];
                            newOrder[idx - 1] = newOrder[idx];
                            newOrder[idx] = temp;
                            onReorderStops(newOrder.map((s) => s.id));
                          }}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          title="Move Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < stops.length - 1 && (
                        <button
                          onClick={() => {
                            const newOrder = [...stops];
                            const temp = newOrder[idx + 1];
                            newOrder[idx + 1] = newOrder[idx];
                            newOrder[idx] = temp;
                            onReorderStops(newOrder.map((s) => s.id));
                          }}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          title="Move Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteStop(stop.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Delete Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Dates: <span className="text-slate-200 font-mono">{stop.arrival_date} → {stop.departure_date}</span></div>
                    <div>Lodging: <span className="text-slate-200">{stop.accommodation_name || 'Not booked yet'}</span></div>
                    {stop.estimated_lodging_cost > 0 && (
                      <div>Est. Lodging: <span className="text-emerald-400 font-mono">{formatINR(stop.estimated_lodging_cost)}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Screen 6: Itinerary View with Mode Toggle (List / Calendar) */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Day-by-Day Itinerary · Screen 6</h3>
                <span className="text-xs text-slate-400">Structured daily plans with time, cost, and location</span>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle: List vs Calendar Cards */}
                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl text-xs">
                  <button
                    onClick={() => setItineraryViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      itineraryViewMode === 'list'
                        ? 'bg-emerald-400 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Structured List</span>
                  </button>
                  <button
                    onClick={() => setItineraryViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      itineraryViewMode === 'calendar'
                        ? 'bg-emerald-400 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Day Cards</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsOsmDrawerOpen(true);
                    if (osmAttractions.length === 0) {
                      handleSearchWorkspaceOsm(osmQuery);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#141e2e] hover:bg-[#1a273b] border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Discover real tourist sights on OpenStreetMap"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Explore OSM Sights</span>
                </button>

                <button
                  onClick={() => setIsAddActivityOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Activity</span>
                </button>
              </div>
            </div>

            {/* Render in List or Calendar Mode */}
            {itineraryViewMode === 'list' ? (
              <div className="space-y-4">
                {datesInRange.map((date, dayIndex) => {
                  const dayActivities = activities
                    .filter((a) => a.date === date)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
                  
                  const dayTotalCost = dayActivities.reduce((s, a) => s + (a.cost || 0), 0);
                  const hasConflict = realityCheck.issues.some(
                    (iss) => iss.affected_date === date && (iss.type === 'overlap' || iss.type === 'temple_timing_conflict')
                  );

                  return (
                    <div key={date} className="rounded-2xl bg-[#121824] border border-white/10 overflow-hidden">
                      <div className="px-5 py-3.5 bg-[#0b0f17]/80 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono font-bold text-emerald-400 text-xs flex items-center justify-center">
                            D{dayIndex + 1}
                          </span>
                          <div>
                            <h4 className="font-semibold text-white text-sm">
                              {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {dayActivities.length} activities scheduled
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          {hasConflict && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-sans font-semibold">
                              Timing Flagged
                            </span>
                          )}
                          <span className="text-slate-300">
                            Day Cost: <strong className="text-emerald-400">{formatINR(dayTotalCost)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5">
                        {dayActivities.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            No activities scheduled for this day yet. Click "+ Add Activity" to schedule morning temple darshan or sightseeing.
                          </div>
                        ) : (
                          dayActivities.map((act) => {
                            const isIssueActivity = realityCheck.issues.some(
                              (iss) => iss.affected_activity_ids?.includes(act.id)
                            );

                            return (
                              <div
                                key={act.id}
                                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isIssueActivity
                                    ? 'bg-amber-950/20 border-amber-500/40'
                                    : 'bg-[#0b0f17] border-white/5 hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-start sm:items-center gap-3">
                                  <span className="text-xs font-mono font-semibold text-slate-300 bg-white/5 px-2 py-1 rounded">
                                    {act.start_time} - {act.end_time}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-semibold text-white text-sm">
                                        {act.activity_title}
                                      </h5>
                                      {act.transit_mode && (
                                        <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-mono">
                                          <Train className="w-3 h-3" />
                                          <span>{act.transit_mode}</span>
                                        </span>
                                      )}
                                      {act.is_optional && (
                                        <span className="text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.2 rounded">
                                          Optional
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                      <span>{act.category}</span>
                                      {act.location_zone && (
                                        <>
                                          <span>·</span>
                                          <span className="text-slate-300">{act.location_zone}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                                  <span className="font-mono font-bold text-emerald-400">
                                    {act.cost > 0 ? formatINR(act.cost) : 'Free'}
                                  </span>

                                  <button
                                    onClick={() => onDeleteActivity(act.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    title="Remove Activity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Calendar Cards Grid Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datesInRange.map((date, dayIndex) => {
                  const dayActs = activities.filter((a) => a.date === date);
                  const dayTotalCost = dayActs.reduce((s, a) => s + (a.cost || 0), 0);
                  return (
                    <div key={date} className="p-4 rounded-2xl bg-[#121824] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="font-mono font-bold text-xs text-emerald-400">Day {dayIndex + 1}</span>
                        <span className="font-mono text-xs text-slate-400">{formatINR(dayTotalCost)}</span>
                      </div>
                      <h4 className="font-serif font-bold text-white text-sm">
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </h4>
                      <div className="space-y-2">
                        {dayActs.map((act) => (
                          <div key={act.id} className="p-2 rounded-lg bg-[#0b0f17] border border-white/5 text-xs space-y-0.5">
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                              <span>{act.start_time} - {act.end_time}</span>
                              <span className="text-emerald-400">{formatINR(act.cost)}</span>
                            </div>
                            <div className="font-medium text-white truncate">{act.activity_title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAILY TIMELINE & CALENDAR (Screen 10) */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#121824] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
            <span>Visual representation of daily schedules, Indian Railways transit windows, and activity blocks · Screen 10</span>
            <span className="text-emerald-400 font-mono">24-hour synchronized grid</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datesInRange.map((date, idx) => {
              const dayActs = activities
                .filter((a) => a.date === date)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div key={date} className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="font-serif font-bold text-white text-base">
                      Day {idx + 1} · {new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">{dayActs.length} events</span>
                  </div>

                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-white/10">
                    {dayActs.length === 0 ? (
                      <div className="text-xs text-slate-500 italic pl-8 py-4">No events scheduled.</div>
                    ) : (
                      dayActs.map((act) => (
                        <div key={act.id} className="relative pl-8 space-y-1">
                          <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#121824]" />
                          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                            <span>{act.start_time} - {act.end_time}</span>
                            {act.transit_mode && (
                              <span className="text-[10px] text-amber-300 font-sans">({act.transit_mode})</span>
                            )}
                          </div>
                          <h5 className="font-medium text-white text-sm">{act.activity_title}</h5>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{act.location_zone}</span>
                            <span className="font-mono text-emerald-400">{formatINR(act.cost)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRIP REALITY CHECK CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === 'reality_check' && (
        <div className="space-y-6">
          
          {/* Header Score Card */}
          <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Indian Travel Feasibility Engine</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">
                Trip Reality Check Analysis
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Validates schedule overlaps, Indian Railways Vande Bharat transit buffers, sacred temple darshan and Ganga Aarti timings, and seasonal climate hazards.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#0b0f17] p-4 rounded-xl border border-white/10 shrink-0">
              <div className="text-right">
                <span className={`text-3xl font-mono font-bold ${
                  realityCheck.feasibilityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {realityCheck.feasibilityScore}%
                </span>
                <span className="block text-xs text-slate-400">Feasibility Index</span>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-4">
            {realityCheck.issues.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-serif font-bold text-white">All Clear! Itinerary Fully Feasible</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  No scheduling collisions, transit gaps, temple timing conflicts, or budget overruns detected. Your trip is ready for smooth travel across India!
                </p>
              </div>
            ) : (
              realityCheck.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    issue.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                          issue.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">{issue.type.replace(/_/g, ' ')}</span>
                      </div>
                      <h4 className="text-base font-semibold text-white">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {issue.description}
                      </p>
                    </div>

                    {issue.affected_date && (
                      <span className="text-xs font-mono text-slate-400 bg-[#0b0f17] px-2.5 py-1 rounded border border-white/10 shrink-0 self-start">
                        {issue.affected_date}
                      </span>
                    )}
                  </div>

                  {/* Fix Box */}
                  {issue.suggested_fix && (
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0f17]/60 p-3.5 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                          Suggested Practical Fix:
                        </span>
                        <p className="text-xs text-slate-200">
                          {issue.suggested_fix.explanation}
                        </p>
                      </div>

                      <button
                        onClick={() => handleFixClick(issue.suggested_fix!)}
                        className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply Fix</span>
                      </button>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BUDGET & EXPENSES (Screen 9) */}
      {/* ========================================================================= */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          
          {/* Progress Bar & KPI Stats */}
          <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Rupee Budget Ledger · Screen 9</span>
                <div className="text-2xl font-serif font-bold text-white mt-0.5">
                  {formatINR(totalCost)} <span className="text-sm font-sans text-slate-400 font-normal">of {formatINR(trip.total_budget)} target</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-mono font-bold ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {remainingBudget >= 0 ? `+${formatINR(remainingBudget)} Surplus` : `-${formatINR(Math.abs(remainingBudget))} Over Budget`}
                </span>
                <span className="block text-[11px] text-slate-400">{Math.round((totalCost / trip.total_budget) * 100)}% Consumed</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#0b0f17] border border-white/10 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${totalCost > trip.total_budget ? 'bg-rose-500' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (totalCost / trip.total_budget) * 100)}%` }}
              />
            </div>
          </div>

          {/* Category Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(categoryTotals).map(([cat, amount]) => (
              <div key={cat} className="p-4 rounded-xl bg-[#121824] border border-white/10">
                <span className="text-[11px] text-slate-400 uppercase font-medium">{cat}</span>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  {formatINR(amount)}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {Math.round((amount / (totalCost || 1)) * 100)}% of total
                </span>
              </div>
            ))}
          </div>

          {/* Expense Ledger */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Expense Ledger</h3>
                <span className="text-xs text-slate-400">Recorded receipts, lodging reservations, and train bookings</span>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#0b0f17] text-slate-400 uppercase text-[10px] font-mono">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount (INR)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-slate-300">{exp.date}</td>
                        <td className="px-4 py-3 text-slate-300">{exp.category}</td>
                        <td className="px-4 py-3 text-white font-medium">{exp.description}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">
                          {formatINR(exp.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SHARE & PUBLISH (Screen 11) */}
      {/* ========================================================================= */}
      {activeTab === 'share' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Public Share Link · Screen 11</h3>
                <p className="text-xs text-slate-400">Generate a read-only itinerary link for friends and co-travelers.</p>
              </div>
              <button
                onClick={() => onUpdateTrip({ is_public: !trip.is_public })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  trip.is_public 
                    ? 'bg-emerald-400 text-slate-950 shadow-sm' 
                    : 'bg-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {trip.is_public ? 'Status: Published' : 'Status: Private'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium block">Shareable Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://globetrotter.in/shared/${trip.share_token}`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-slate-300 text-xs font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://globetrotter.in/shared/${trip.share_token}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenPublicView(trip.share_token)}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Public View</span>
              </button>

              <button
                onClick={onDuplicateTrip}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Clone This Trip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CITY STOP */}
      {/* ========================================================================= */}
      {isAddStopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-white">Add Indian City Stop</h3>
            
            <div>
              <label className="text-slate-300 block mb-1">City Name *</label>
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="e.g. Udaipur, Jodhpur, Munnar, Goa"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">State / Country</label>
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="e.g. Rajasthan, India"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1">Arrival Date</label>
                <input
                  type="date"
                  value={newArrival}
                  onChange={(e) => setNewArrival(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Departure Date</label>
                <input
                  type="date"
                  value={newDeparture}
                  onChange={(e) => setNewDeparture(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Accommodation / Haveli Name</label>
              <input
                type="text"
                value={newLodging}
                onChange={(e) => setNewLodging(e.target.value)}
                placeholder="e.g. Trident Hotel or Heritage Haveli"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAddStopOpen(false)}
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newCityName) return;
                  onCreateStop({
                    trip_id: trip.id,
                    city_name: newCityName,
                    country: newCountry || 'India',
                    arrival_date: newArrival,
                    departure_date: newDeparture,
                    stop_order: stops.length + 1,
                    accommodation_name: newLodging,
                    estimated_lodging_cost: parseFloat(newLodgingCost) || 0,
                  });
                  setNewCityName('');
                  setIsAddStopOpen(false);
                  showToast('City stop added to route');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold cursor-pointer shadow-sm"
              >
                Add Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ACTIVITY */}
      {/* ========================================================================= */}
      {isAddActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-white">Schedule Indian Activity</h3>
            
            <div>
              <label className="text-slate-300 block mb-1">Activity Title *</label>
              <input
                type="text"
                value={newActTitle}
                onChange={(e) => setNewActTitle(e.target.value)}
                placeholder="e.g. Subah-e-Banaras Boat Ride or Amber Fort Walk"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1">Category</label>
                <select
                  value={newActCategory}
                  onChange={(e) => setNewActCategory(e.target.value as ActivityCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Culinary">Culinary</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Relaxation">Relaxation</option>
                  <option value="Transit">Transit</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Date</label>
                <input
                  type="date"
                  value={newActDate}
                  onChange={(e) => setNewActDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1">Start Time (HH:mm)</label>
                <input
                  type="time"
                  value={newActStartTime}
                  onChange={(e) => setNewActStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">End Time (HH:mm)</label>
                <input
                  type="time"
                  value={newActEndTime}
                  onChange={(e) => setNewActEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1">Estimated Cost (INR ₹)</label>
                <input
                  type="number"
                  value={newActCost}
                  onChange={(e) => setNewActCost(e.target.value)}
                  placeholder="650"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Location / Zone</label>
                <input
                  type="text"
                  value={newActZone}
                  onChange={(e) => setNewActZone(e.target.value)}
                  placeholder="e.g. Dashashwamedh Ghat"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="optCheck"
                checked={newActOptional}
                onChange={(e) => setNewActOptional(e.target.checked)}
                className="rounded bg-[#0b0f17] border-white/20 text-emerald-400"
              />
              <label htmlFor="optCheck" className="text-slate-300">
                Mark as optional (flexible schedule buffer)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAddActivityOpen(false)}
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newActTitle) return;
                  onCreateActivity({
                    trip_id: trip.id,
                    stop_id: newActStopId || stops[0]?.id || '',
                    activity_title: newActTitle,
                    category: newActCategory,
                    date: newActDate,
                    start_time: newActStartTime,
                    end_time: newActEndTime,
                    cost: parseFloat(newActCost) || 0,
                    currency: 'INR',
                    location_zone: newActZone || 'Central Zone',
                    is_optional: newActOptional,
                    status: 'planned',
                  });
                  setNewActTitle('');
                  setIsAddActivityOpen(false);
                  showToast('Activity scheduled into plan');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold cursor-pointer shadow-sm"
              >
                Schedule Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD EXPENSE */}
      {/* ========================================================================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-white">Record Rupee Expense</h3>
            
            <div>
              <label className="text-slate-300 block mb-1">Description *</label>
              <input
                type="text"
                value={newExpDesc}
                onChange={(e) => setNewExpDesc(e.target.value)}
                placeholder="e.g. Vande Bharat Express Ticket"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1">Amount (INR ₹) *</label>
                <input
                  type="number"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Category</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
                >
                  <option value="Transport">Transport</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Food">Food</option>
                  <option value="Activities">Activities</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Date</label>
              <input
                type="date"
                value={newExpDate}
                onChange={(e) => setNewExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(newExpAmount);
                  if (!newExpDesc || isNaN(amt)) return;
                  onCreateExpense({
                    trip_id: trip.id,
                    category: newExpCategory,
                    amount: amt,
                    currency: 'INR',
                    date: newExpDate,
                    description: newExpDesc,
                  });
                  setNewExpDesc('');
                  setIsAddExpenseOpen(false);
                  showToast('Expense recorded in budget');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold cursor-pointer shadow-sm"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPLORE OPENSTREETMAP ATTRACTIONS */}
      {/* ========================================================================= */}
      {isOsmDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#121824] border border-white/15 rounded-2xl p-6 space-y-4 text-xs shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-serif font-bold text-white">
                  Discover Points of Interest (OpenStreetMap)
                </h3>
              </div>
              <button
                onClick={() => setIsOsmDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Destination Search Form */}
            <div className="shrink-0 space-y-3">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchWorkspaceOsm(osmQuery);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={osmQuery}
                    onChange={(e) => setOsmQuery(e.target.value)}
                    placeholder="Search any destination city or state (e.g. Mysore, Amritsar, Hampi, Agra)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-white/15 text-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={osmLoading || !osmQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-semibold hover:bg-emerald-300 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {osmLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  <span>Search OSM</span>
                </button>
              </form>

              {/* Schedule Target Selector (Date & Time) */}
              <div className="p-3 rounded-xl bg-[#0b0f17] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Date:</span>
                  <select
                    value={osmSelectedDate}
                    onChange={(e) => setOsmSelectedDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs"
                  >
                    {datesInRange.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Time:</span>
                  <input
                    type="time"
                    value={osmSelectedTime}
                    onChange={(e) => setOsmSelectedTime(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Attribution */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Free unauthenticated Overpass queries</span>
                <div className="flex items-center gap-1">
                  <span>Map data</span>
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    © OpenStreetMap contributors
                  </a>
                </div>
              </div>
            </div>

            {/* Error or Notice */}
            {osmErrorMsg && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 shrink-0">
                <span>{osmErrorMsg}</span>
                <button
                  onClick={() => handleSearchWorkspaceOsm(osmQuery, true)}
                  className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] cursor-pointer"
                >
                  Load Demo Fallback [Demo]
                </button>
              </div>
            )}

            {/* Category Filter */}
            {osmAttractions.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                {(['All', 'Historic & Heritage', 'Culture & Temples', 'Viewpoints', 'Nature & Parks', 'Leisure & Sights'] as OsmAttractionCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setOsmCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      osmCategoryFilter === cat 
                        ? 'bg-emerald-400 text-slate-950 font-semibold' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Attractions List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {osmLoading && (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto text-emerald-400 animate-spin" />
                  <p>Fetching mapped landmarks from Overpass API...</p>
                </div>
              )}

              {!osmLoading && osmAttractions.length === 0 && !osmErrorMsg && (
                <div className="p-8 text-center text-slate-400">
                  Search a destination above to see live OpenStreetMap attractions.
                </div>
              )}

              {!osmLoading && osmAttractions
                .filter(a => osmCategoryFilter === 'All' || a.category === osmCategoryFilter)
                .map((poi) => {
                  let category: ActivityCategory = 'Sightseeing';
                  if (poi.category === 'Culture & Temples') category = 'Cultural';
                  else if (poi.category === 'Nature & Parks') category = 'Relaxation';
                  else if (poi.category === 'Historic & Heritage') category = 'Cultural';

                  return (
                    <div
                      key={poi.id}
                      className="p-3.5 rounded-xl bg-[#0b0f17] border border-white/10 hover:border-emerald-500/30 flex items-start justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                            {poi.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            OSM #{poi.osmId}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm">{poi.name}</h4>
                        <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                          {poi.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                          <span>Est. {poi.estimatedDurationMins}m</span>
                          <span>·</span>
                          <span className="text-emerald-300 font-semibold">
                            {poi.estimatedCostINR === 0 ? 'Free' : formatINR(poi.estimatedCostINR)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const [h, m] = osmSelectedTime.split(':').map(Number);
                          const startM = h * 60 + m;
                          const endM = startM + poi.estimatedDurationMins;
                          const endHStr = String(Math.floor(endM / 60) % 24).padStart(2, '0');
                          const endMStr = String(endM % 60).padStart(2, '0');

                          onCreateActivity({
                            trip_id: trip.id,
                            stop_id: stops[0]?.id || '',
                            activity_title: poi.name,
                            category,
                            date: osmSelectedDate,
                            start_time: osmSelectedTime,
                            end_time: `${endHStr}:${endMStr}`,
                            cost: poi.estimatedCostINR,
                            currency: 'INR',
                            location_zone: `${osmGeoInfo?.city || 'City'} (${poi.category})`,
                            is_optional: false,
                            status: 'planned',
                            notes: poi.description,
                          });

                          showToast(`Added ${poi.name} to ${osmSelectedDate}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition-colors shrink-0 cursor-pointer shadow-sm text-xs"
                      >
                        + Add to Day
                      </button>
                    </div>
                  );
                })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
