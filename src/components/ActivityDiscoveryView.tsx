import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  DollarSign, 
  MapPin, 
  Plus, 
  Check, 
  Sparkles, 
  Compass, 
  Star,
  Globe,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  ActivityCatalogItem, 
  ActivityCategory, 
  Trip, 
  TripStop, 
  ScheduledActivity, 
  formatINR,
  OsmAttraction,
  OsmAttractionCategory,
  DestinationGeoInfo
} from '../types/travel';
import { 
  geocodeDestination, 
  fetchOverpassPOIs, 
  getDemoFallbackPOIs 
} from '../services/overpassService';

interface ActivityDiscoveryViewProps {
  activities: ActivityCatalogItem[];
  trips: Trip[];
  stops: TripStop[];
  onScheduleActivity: (activityData: Omit<ScheduledActivity, 'id'>) => void;
  onRequireAuth?: () => void;
  isAuthenticated?: boolean;
}

export const ActivityDiscoveryView: React.FC<ActivityDiscoveryViewProps> = ({
  activities,
  trips,
  stops,
  onScheduleActivity,
  onRequireAuth,
  isAuthenticated = true,
}) => {
  const [activeTab, setActiveTab] = useState<'osm' | 'curated'>('osm');

  // OpenStreetMap Live Sights State
  const [osmQuery, setOsmQuery] = useState('Amritsar');
  const [isLoadingOsm, setIsLoadingOsm] = useState(false);
  const [osmGeoInfo, setOsmGeoInfo] = useState<DestinationGeoInfo | null>(null);
  const [osmAttractions, setOsmAttractions] = useState<OsmAttraction[]>([]);
  const [osmCategoryFilter, setOsmCategoryFilter] = useState<OsmAttractionCategory>('All');
  const [osmError, setOsmError] = useState<string | null>(null);
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  // Curated Catalog Search & Filter
  const [curatedSearchTerm, setCuratedSearchTerm] = useState('');
  const [curatedCategory, setCuratedCategory] = useState<string>('All');
  const [curatedIntensity, setCuratedIntensity] = useState<string>('All');

  // Modal schedule state
  const [selectedActivityForAdd, setSelectedActivityForAdd] = useState<ActivityCatalogItem | null>(null);
  const [selectedOsmForAdd, setSelectedOsmForAdd] = useState<OsmAttraction | null>(null);

  const [targetTripId, setTargetTripId] = useState<string>(trips[0]?.id || '');
  const [schedDate, setSchedDate] = useState<string>(trips[0]?.start_date || '2026-11-05');
  const [schedStartTime, setSchedStartTime] = useState<string>('10:00');
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const curatedCategories = ['All', 'Cultural', 'Sightseeing', 'Culinary', 'Adventure', 'Relaxation', 'Transit'];
  const quickOsmPresets = ['Amritsar, Punjab', 'Mysore, Karnataka', 'Hampi, Karnataka', 'Kochi, Kerala', 'Agra, UP', 'Varanasi, UP'];

  useEffect(() => {
    executeOsmSearch('Amritsar');
  }, []);

  const executeOsmSearch = async (destinationQuery: string, forceFallback = false) => {
    const query = destinationQuery.trim();
    if (!query) return;

    setIsLoadingOsm(true);
    setOsmError(null);
    setIsDemoFallback(false);

    try {
      if (forceFallback) {
        setOsmGeoInfo({
          query,
          displayName: `${query}, India`,
          city: query,
          country: 'India',
          lat: 31.6340,
          lon: 74.8723,
        });
        setOsmAttractions(getDemoFallbackPOIs(query, 31.6340, 74.8723));
        setIsDemoFallback(true);
        setIsLoadingOsm(false);
        return;
      }

      const geo = await geocodeDestination(query);
      if (!geo) {
        setOsmError(`Unable to locate "${query}" on OpenStreetMap. Try another city or view the regional demo fallback.`);
        setOsmGeoInfo(null);
        setOsmAttractions([]);
        setIsLoadingOsm(false);
        return;
      }

      setOsmGeoInfo(geo);
      const result = await fetchOverpassPOIs(geo.lat, geo.lon, 15000);

      if (result.attractions.length > 0) {
        setOsmAttractions(result.attractions);
      } else {
        setOsmAttractions([]);
        if (result.error) {
          setOsmError(`Overpass notice: ${result.error}.`);
        } else {
          setOsmError(`No mapped tourist attractions were found within 15 km of "${geo.city}" on OpenStreetMap.`);
        }
      }
    } catch (err: any) {
      setOsmError(err.message || 'Error communicating with OpenStreetMap.');
      setOsmAttractions([]);
    } finally {
      setIsLoadingOsm(false);
    }
  };

  // Filtered OSM list
  const filteredOsmAttractions = osmAttractions.filter((item) => {
    if (osmCategoryFilter === 'All') return true;
    return item.category === osmCategoryFilter;
  });

  // Filtered Curated list
  const filteredCuratedActivities = activities.filter((act) => {
    const text = `${act.title} ${act.city} ${act.country} ${act.description} ${act.zone}`.toLowerCase();
    const matchesSearch = text.includes(curatedSearchTerm.toLowerCase());
    const matchesCategory = curatedCategory === 'All' || act.category === curatedCategory;
    const matchesIntensity = curatedIntensity === 'All' || act.physical_intensity === curatedIntensity;
    return matchesSearch && matchesCategory && matchesIntensity;
  });

  // Open Schedule Modal for Curated
  const handleOpenCuratedSchedule = (act: ActivityCatalogItem) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setSelectedActivityForAdd(act);
    setSelectedOsmForAdd(null);
    const trip = trips.find((t) => t.id === targetTripId) || trips[0];
    if (trip) setSchedDate(trip.start_date);
    if (act.optimal_time_of_day === 'Morning') setSchedStartTime('08:30');
    else if (act.optimal_time_of_day === 'Afternoon') setSchedStartTime('14:00');
    else if (act.optimal_time_of_day === 'Sunset') setSchedStartTime('17:30');
    else setSchedStartTime('11:00');
  };

  // Open Schedule Modal for OSM Attraction
  const handleOpenOsmSchedule = (poi: OsmAttraction) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setSelectedOsmForAdd(poi);
    setSelectedActivityForAdd(null);
    const trip = trips.find((t) => t.id === targetTripId) || trips[0];
    if (trip) setSchedDate(trip.start_date);
    setSchedStartTime('09:30');
  };

  const handleConfirmSchedule = () => {
    if (!targetTripId) return;

    if (selectedActivityForAdd) {
      const [h, m] = schedStartTime.split(':').map(Number);
      const startMins = h * 60 + m;
      const endMins = startMins + selectedActivityForAdd.duration_mins;
      const endH = Math.floor(endMins / 60) % 24;
      const endM = endMins % 60;
      const schedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const tripStops = stops.filter((s) => s.trip_id === targetTripId);
      const matchingStop = tripStops.find(
        (s) => s.city_name.toLowerCase() === selectedActivityForAdd.city.toLowerCase()
      ) || tripStops[0];

      onScheduleActivity({
        trip_id: targetTripId,
        stop_id: matchingStop?.id || '',
        activity_title: selectedActivityForAdd.title,
        category: selectedActivityForAdd.category,
        date: schedDate,
        start_time: schedStartTime,
        end_time: schedEndTime,
        cost: selectedActivityForAdd.estimated_cost,
        currency: 'INR',
        location_zone: selectedActivityForAdd.zone,
        is_optional: isOptional,
        status: 'planned',
        catalog_id: selectedActivityForAdd.id,
      });

      setToastMessage(`Scheduled "${selectedActivityForAdd.title}" into your itinerary!`);
      setSelectedActivityForAdd(null);
    } else if (selectedOsmForAdd) {
      const [h, m] = schedStartTime.split(':').map(Number);
      const startMins = h * 60 + m;
      const endMins = startMins + selectedOsmForAdd.estimatedDurationMins;
      const endH = Math.floor(endMins / 60) % 24;
      const endM = endMins % 60;
      const schedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const tripStops = stops.filter((s) => s.trip_id === targetTripId);
      const cityName = osmGeoInfo?.city || 'Destination';
      const matchingStop = tripStops.find(
        (s) => s.city_name.toLowerCase() === cityName.toLowerCase()
      ) || tripStops[0];

      let category: ActivityCategory = 'Sightseeing';
      if (selectedOsmForAdd.category === 'Culture & Temples') category = 'Cultural';
      else if (selectedOsmForAdd.category === 'Nature & Parks') category = 'Relaxation';
      else if (selectedOsmForAdd.category === 'Historic & Heritage') category = 'Cultural';

      onScheduleActivity({
        trip_id: targetTripId,
        stop_id: matchingStop?.id || '',
        activity_title: selectedOsmForAdd.name,
        category,
        date: schedDate,
        start_time: schedStartTime,
        end_time: schedEndTime,
        cost: selectedOsmForAdd.estimatedCostINR,
        currency: 'INR',
        location_zone: `${cityName} (${selectedOsmForAdd.category})`,
        is_optional: isOptional,
        status: 'planned',
        notes: `${selectedOsmForAdd.description} (OSM ID: ${selectedOsmForAdd.osmId})`,
      });

      setToastMessage(`Scheduled "${selectedOsmForAdd.name}" from OpenStreetMap!`);
      setSelectedOsmForAdd(null);
    }

    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white animate-fadeIn">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Compass className="w-4 h-4" />
            <span>Activity Discovery · Real-Time Mapping</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mt-1">
            Discover Activities & Landmarks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Search OpenStreetMap for real mapped points of interest in any global or Indian destination, or explore curated regional experiences.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('osm')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'osm'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live OSM Points of Interest</span>
          </button>
          <button
            onClick={() => setActiveTab('curated')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'curated'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Catalog ({activities.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: OPENSTREETMAP LIVE SEARCH ===================== */}
      {activeTab === 'osm' && (
        <div className="space-y-6">
          
          {/* Search Bar */}
          <div className="bg-[#121824] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                executeOsmSearch(osmQuery);
              }}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter any city or region to query mapped landmarks (e.g. Amritsar, Mysore, Hampi, Agra)..."
                  value={osmQuery}
                  onChange={(e) => setOsmQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b0f17] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs sm:text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingOsm || !osmQuery.trim()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-emerald-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isLoadingOsm ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching OSM...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search OpenStreetMap</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Quick Destinations:</span>
              {quickOsmPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const city = preset.split(',')[0];
                    setOsmQuery(city);
                    executeOsmSearch(city);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* OSM Attribution */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Live Overpass API query · Free unauthenticated public endpoints</span>
              </div>
              <div>
                Map data{' '}
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

          {/* Fallback Banner */}
          {isDemoFallback && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Showing regional demo fallback landmarks. OpenStreetMap servers may be under heavy load.</span>
              </div>
              <button
                onClick={() => executeOsmSearch(osmQuery)}
                className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
              >
                Retry Live
              </button>
            </div>
          )}

          {/* Error Notice */}
          {osmError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{osmError}</span>
              </div>
              <button
                onClick={() => executeOsmSearch(osmQuery, true)}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
              >
                Load Demo Fallback [Demo]
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoadingOsm && (
            <div className="p-12 text-center bg-[#121824] border border-white/10 rounded-2xl space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Querying OpenStreetMap attractions for {osmQuery}...</p>
            </div>
          )}

          {/* Results */}
          {!isLoadingOsm && osmAttractions.length > 0 && (
            <div className="space-y-4">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {(['All', 'Historic & Heritage', 'Culture & Temples', 'Viewpoints', 'Nature & Parks', 'Leisure & Sights'] as OsmAttractionCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setOsmCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      osmCategoryFilter === cat 
                        ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOsmAttractions.map((attraction) => (
                  <div
                    key={attraction.id}
                    className="group bg-[#121824] border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                          {attraction.category}
                        </span>
                        {attraction.isDemoFallback && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Demo
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                        {attraction.name}
                      </h3>
                      {attraction.localName && (
                        <span className="text-xs text-slate-400 block mt-0.5">{attraction.localName}</span>
                      )}

                      <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                        {attraction.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{attraction.estimatedDurationMins} mins</span>
                        </span>
                        <span className="font-mono font-semibold text-emerald-300 text-xs">
                          {attraction.estimatedCostINR === 0 ? 'Free' : formatINR(attraction.estimatedCostINR)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenOsmSchedule(attraction)}
                          className="flex-1 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Schedule in Journey</span>
                        </button>

                        <a
                          href={`https://www.openstreetmap.org/${attraction.osmType}/${attraction.osmId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                          title="View on OpenStreetMap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* ===================== TAB 2: CURATED EXPERIENCES ===================== */}
      {activeTab === 'curated' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search curated experiences by title, temple, fort..."
                value={curatedSearchTerm}
                onChange={(e) => setCuratedSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121824] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none self-start sm:self-auto">
              {curatedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCuratedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    curatedCategory === cat 
                      ? 'bg-emerald-400 text-slate-950 font-semibold shadow-sm' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCuratedActivities.map((act) => (
              <div
                key={act.id}
                className="group bg-[#121824] border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={act.image_url}
                    alt={act.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0b0f17]/80 backdrop-blur-md border border-white/10 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    {act.category}
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-emerald-300">
                      {act.estimated_cost === 0 ? 'Free' : formatINR(act.estimated_cost)}
                    </span>
                    <span className="text-slate-300 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{act.duration_mins} mins</span>
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                      {act.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{act.city}, {act.country} ({act.zone})</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                      {act.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenCuratedSchedule(act)}
                      className="w-full py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule in Journey</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== SCHEDULE MODAL (FOR BOTH OSM & CURATED) ===================== */}
      {(selectedActivityForAdd || selectedOsmForAdd) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-white">
              Schedule: {selectedActivityForAdd ? selectedActivityForAdd.title : selectedOsmForAdd?.name}
            </h3>

            <p className="text-slate-400">
              Select destination journey, date, and schedule time slot.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">Target Journey</label>
                <select
                  value={targetTripId}
                  onChange={(e) => setTargetTripId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.start_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Activity Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="schedOptional"
                  checked={isOptional}
                  onChange={(e) => setIsOptional(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-emerald-400"
                />
                <label htmlFor="schedOptional" className="text-slate-300 cursor-pointer">
                  Mark as optional / flexible stop
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setSelectedActivityForAdd(null);
                  setSelectedOsmForAdd(null);
                }}
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold cursor-pointer shadow-sm"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
