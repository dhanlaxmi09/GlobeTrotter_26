import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  Check, 
  Sparkles, 
  Compass,
  Globe,
  ExternalLink,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  Landmark,
  TreePine,
  Eye,
  Camera,
  Info
} from 'lucide-react';
import { 
  CityCatalogItem, 
  Trip, 
  formatINR, 
  OsmAttraction, 
  OsmAttractionCategory, 
  DestinationGeoInfo, 
  GeneratedItineraryPlan 
} from '../types/travel';
import { 
  geocodeDestination, 
  fetchOverpassPOIs, 
  getDemoFallbackPOIs, 
  generateItineraryFromSelectedPOIs 
} from '../services/overpassService';

interface CityDiscoveryViewProps {
  cities: CityCatalogItem[];
  savedCityIds: string[];
  trips: Trip[];
  onToggleSaveCity: (cityId: string) => void;
  onAddCityToTrip: (city: CityCatalogItem, tripId: string) => void;
  onCreateTripWithCity: (city: CityCatalogItem) => void;
  onCreateGeneratedTrip?: (plan: GeneratedItineraryPlan) => void;
  onRequireAuth?: () => void;
  isAuthenticated?: boolean;
}

export const CityDiscoveryView: React.FC<CityDiscoveryViewProps> = ({
  cities,
  savedCityIds,
  trips,
  onToggleSaveCity,
  onAddCityToTrip,
  onCreateTripWithCity,
  onCreateGeneratedTrip,
  onRequireAuth,
  isAuthenticated = true,
}) => {
  // Discovery Mode: 'osm' (Arbitrary Destinations via OpenStreetMap) vs 'curated' (Curated Indian Catalog)
  const [activeMode, setActiveMode] = useState<'osm' | 'curated'>('osm');

  // OpenStreetMap Arbitrary Search States
  const [osmQuery, setOsmQuery] = useState('Mysore');
  const [isLoadingOsm, setIsLoadingOsm] = useState(false);
  const [osmGeoInfo, setOsmGeoInfo] = useState<DestinationGeoInfo | null>(null);
  const [osmAttractions, setOsmAttractions] = useState<OsmAttraction[]>([]);
  const [osmCategoryFilter, setOsmCategoryFilter] = useState<OsmAttractionCategory>('All');
  const [osmError, setOsmError] = useState<string | null>(null);
  const [isUsingDemoFallback, setIsUsingDemoFallback] = useState(false);

  // Selection for Multi-Day Itinerary Builder
  const [selectedPoiIds, setSelectedPoiIds] = useState<Set<string>>(new Set());
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Itinerary Generator Form State
  const [planTripTitle, setPlanTripTitle] = useState('');
  const [planStartDate, setPlanStartDate] = useState('2026-11-12');
  const [planEndDate, setPlanEndDate] = useState('2026-11-15');
  const [planBudgetINR, setPlanBudgetINR] = useState('35000');
  const [planPacing, setPlanPacing] = useState<'relaxed' | 'balanced' | 'fast-paced'>('balanced');

  // Curated Catalog Search & Filter States
  const [curatedSearchTerm, setCuratedSearchTerm] = useState('');
  const [curatedCircuit, setCuratedCircuit] = useState<string>('All');

  // Dialog State for adding single item to existing trip
  const [selectedCityForAdd, setSelectedCityForAdd] = useState<CityCatalogItem | null>(null);
  const [selectedOsmForAdd, setSelectedOsmForAdd] = useState<OsmAttraction | null>(null);
  const [targetTripId, setTargetTripId] = useState<string>(trips[0]?.id || '');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const circuits = ['All', 'Rajasthan', 'Ladakh', 'Kerala', 'Varanasi', 'Goa', 'Uttarakhand'];
  const popularPresets = ['Mysore, Karnataka', 'Amritsar, Punjab', 'Hampi, Karnataka', 'Kochi, Kerala', 'Agra, UP', 'Darjeeling, WB'];

  // Initial OpenStreetMap Search on mount
  useEffect(() => {
    executeOsmSearch('Mysore');
  }, []);

  const executeOsmSearch = async (destinationQuery: string, forceFallback = false) => {
    const query = destinationQuery.trim();
    if (!query) return;

    setIsLoadingOsm(true);
    setOsmError(null);
    setIsUsingDemoFallback(false);
    setSelectedPoiIds(new Set());

    try {
      if (forceFallback) {
        const fallbackGeo: DestinationGeoInfo = {
          query,
          displayName: `${query}, India`,
          city: query,
          country: 'India',
          lat: 26.9124,
          lon: 75.7873,
        };
        setOsmGeoInfo(fallbackGeo);
        const fallbackPOIs = getDemoFallbackPOIs(query, 26.9124, 75.7873);
        setOsmAttractions(fallbackPOIs);
        setIsUsingDemoFallback(true);
        setPlanTripTitle(`${query} Heritage Exploration`);
        setIsLoadingOsm(false);
        return;
      }

      // Step 1: Geocode via Nominatim
      const geo = await geocodeDestination(query);
      if (!geo) {
        setOsmError(`Unable to geocode "${query}" on OpenStreetMap. Please check the spelling or load the regional demo fallback.`);
        setOsmGeoInfo(null);
        setOsmAttractions([]);
        setIsLoadingOsm(false);
        return;
      }

      setOsmGeoInfo(geo);
      setPlanTripTitle(`${geo.city} Journey`);

      // Step 2: Fetch tourist attractions from Overpass API
      const result = await fetchOverpassPOIs(geo.lat, geo.lon, 15000);

      if (result.attractions.length > 0) {
        setOsmAttractions(result.attractions);
        setIsUsingDemoFallback(false);
        // Automatically preselect top 5 attractions for user convenience
        const initialSelected = new Set<string>();
        result.attractions.slice(0, 5).forEach(a => initialSelected.add(a.id));
        setSelectedPoiIds(initialSelected);
      } else {
        // Zero results returned from Overpass
        setOsmAttractions([]);
        if (result.error) {
          setOsmError(`Overpass API notice: ${result.error}. OpenStreetMap public servers might be under high load.`);
        } else {
          setOsmError(`No tourist attractions or historic landmarks were found within 15 km of "${geo.city}" on OpenStreetMap.`);
        }
      }
    } catch (err: any) {
      setOsmError(err.message || 'An unexpected error occurred while communicating with OpenStreetMap.');
      setOsmAttractions([]);
    } finally {
      setIsLoadingOsm(false);
    }
  };

  const handleToggleSelectPoi = (id: string) => {
    setSelectedPoiIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedPoiIds);
    filteredOsmAttractions.forEach(a => next.add(a.id));
    setSelectedPoiIds(next);
  };

  const handleClearSelection = () => {
    setSelectedPoiIds(new Set());
  };

  // Filtered OSM Attractions by Category
  const filteredOsmAttractions = osmAttractions.filter(item => {
    if (osmCategoryFilter === 'All') return true;
    return item.category === osmCategoryFilter;
  });

  // Category counts
  const categoryCounts = osmAttractions.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Multi-day Itinerary Generation Trigger
  const handleLaunchItineraryGenerator = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    if (selectedPoiIds.size === 0) {
      alert('Please select at least one attraction to generate an itinerary.');
      return;
    }
    setIsPlanModalOpen(true);
  };

  const handleConfirmGeneratedItinerary = () => {
    if (!onCreateGeneratedTrip || !osmGeoInfo) return;

    const selectedList = osmAttractions.filter(a => selectedPoiIds.has(a.id));
    const budgetNum = parseFloat(planBudgetINR) || 35000;

    const generatedPlan = generateItineraryFromSelectedPOIs({
      destinationTitle: planTripTitle.trim() || `${osmGeoInfo.city} Multi-Day Journey`,
      cityName: osmGeoInfo.city,
      countryName: osmGeoInfo.country,
      startDate: planStartDate,
      endDate: planEndDate,
      totalBudgetINR: budgetNum,
      selectedPOIs: selectedList.length > 0 ? selectedList : osmAttractions.slice(0, 4),
      pacing: planPacing,
    });

    onCreateGeneratedTrip(generatedPlan);
    setIsPlanModalOpen(false);
  };

  // Add single OSM attraction into an existing trip as scheduled activity
  const handleAddOsmToTripConfirm = () => {
    if (!selectedOsmForAdd || !targetTripId) return;
    const trip = trips.find(t => t.id === targetTripId);
    if (!trip) return;

    // Convert to CityCatalogItem or schedule directly
    const convertedCity: CityCatalogItem = {
      id: `osm_loc_${Date.now()}`,
      city_name: osmGeoInfo?.city || selectedOsmForAdd.name,
      country: osmGeoInfo?.country || 'India',
      region: 'Asia',
      description: selectedOsmForAdd.description,
      image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      avg_daily_budget: 3500,
      currency: 'INR',
      best_season: 'Oct - Mar',
      highlights: [selectedOsmForAdd.name],
      vibe: selectedOsmForAdd.category,
    };

    onAddCityToTrip(convertedCity, targetTripId);
    setSuccessToast(`Added ${selectedOsmForAdd.name} to ${trip.title}!`);
    setSelectedOsmForAdd(null);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Curated Cities Filter
  const filteredCuratedCities = cities.filter((city) => {
    const text = `${city.city_name} ${city.country} ${city.description} ${city.vibe} ${city.highlights.join(' ')}`.toLowerCase();
    const matchesSearch = text.includes(curatedSearchTerm.toLowerCase());
    const matchesCircuit = curatedCircuit === 'All' || text.includes(curatedCircuit.toLowerCase());
    return matchesSearch && matchesCircuit;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white animate-fadeIn">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Compass className="w-4 h-4" />
            <span>Destination Discovery · OpenStreetMap Powered</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mt-1">
            Discover Any Destination
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Query mapped tourist attractions, historic citadels, sacred shrines, and scenic viewpoints for any city or state in real time without paid API keys.
          </p>
        </div>

        {/* Discovery Mode Switcher */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl self-start lg:self-auto">
          <button
            onClick={() => setActiveMode('osm')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'osm'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live OpenStreetMap</span>
          </button>
          <button
            onClick={() => setActiveMode('curated')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'curated'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Indian Tours ({cities.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== MODE 1: OPENSTREETMAP DYNAMIC SEARCH ===================== */}
      {activeMode === 'osm' && (
        <div className="space-y-6">
          
          {/* Search Box & Quick Presets */}
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
                  placeholder="Enter any city, state, or district (e.g. Mysore, Amritsar, Hampi, Kochi, Agra, Paris)..."
                  value={osmQuery}
                  onChange={(e) => setOsmQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b0f17] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isLoadingOsm || !osmQuery.trim()}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-emerald-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isLoadingOsm ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Querying OSM...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search OpenStreetMap</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Suggestions Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Instant Queries:</span>
              </span>
              {popularPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setOsmQuery(preset.split(',')[0]);
                    executeOsmSearch(preset.split(',')[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* OpenStreetMap Attribution & Provider Compliance Notice */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Real Overpass API queries · No API key or billing required</span>
              </div>
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
                <span>(ODbL 1.0)</span>
              </div>
            </div>
          </div>

          {/* Fallback Banner if using Demo Fallback */}
          {isUsingDemoFallback && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <strong className="block font-semibold">Demo Fallback Mode Active</strong>
                  <span>Displaying clearly labeled regional fallback places because OpenStreetMap has low coverage or Overpass servers experienced a rate limit.</span>
                </div>
              </div>
              <button
                onClick={() => executeOsmSearch(osmQuery)}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 text-[11px] shrink-0 cursor-pointer"
              >
                Retry Live OSM
              </button>
            </div>
          )}

          {/* Error Banner */}
          {osmError && (
            <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <div>
                  <strong className="block font-semibold text-rose-200">OpenStreetMap Search Notice</strong>
                  <p className="mt-0.5 text-rose-300 leading-relaxed">{osmError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => executeOsmSearch(osmQuery, true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 text-xs transition-colors cursor-pointer"
                >
                  Load Regional Demo Fallback [Demo]
                </button>
                <button
                  onClick={() => executeOsmSearch(osmQuery)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition-colors cursor-pointer"
                >
                  Retry Query
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingOsm && (
            <div className="p-12 text-center bg-[#121824] border border-white/10 rounded-2xl space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              <h3 className="text-base font-serif font-bold text-white">
                Querying OpenStreetMap Nominatim & Overpass API...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Geocoding destination boundary and searching mapped monuments, temples, viewpoints, and tourist attractions.
              </p>
            </div>
          )}

          {/* Results Summary & Controls */}
          {!isLoadingOsm && osmGeoInfo && osmAttractions.length > 0 && (
            <div className="space-y-4">
              
              {/* Geocoded Destination Metadata Banner */}
              <div className="p-4 rounded-xl bg-[#121824] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h2 className="text-base font-serif font-bold text-white">
                      {osmGeoInfo.city}
                      {osmGeoInfo.state ? `, ${osmGeoInfo.state}` : ''} ({osmGeoInfo.country})
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {osmGeoInfo.lat.toFixed(4)}° N, {osmGeoInfo.lon.toFixed(4)}° E
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 truncate max-w-xl">
                    {osmGeoInfo.displayName}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                    {osmAttractions.length} Live Sights Mapped
                  </span>
                </div>
              </div>

              {/* Category Filter Pills & Selection Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                  {(['All', 'Historic & Heritage', 'Culture & Temples', 'Viewpoints', 'Nature & Parks', 'Leisure & Sights'] as OsmAttractionCategory[]).map((cat) => {
                    const count = cat === 'All' ? osmAttractions.length : (categoryCounts[cat] || 0);
                    return (
                      <button
                        key={cat}
                        onClick={() => setOsmCategoryFilter(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                          osmCategoryFilter === cat 
                            ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm' 
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          osmCategoryFilter === cat ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selection Helpers */}
                <div className="flex items-center gap-2 self-start md:self-auto text-xs">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] cursor-pointer"
                  >
                    Select Filtered ({filteredOsmAttractions.length})
                  </button>
                  {selectedPoiIds.size > 0 && (
                    <button
                      onClick={handleClearSelection}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/10 text-[11px] cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Attractions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOsmAttractions.map((attraction) => {
                  const isSelected = selectedPoiIds.has(attraction.id);

                  return (
                    <div
                      key={attraction.id}
                      onClick={() => handleToggleSelectPoi(attraction.id)}
                      className={`group bg-[#121824] border rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-emerald-400 ring-1 ring-emerald-400/50 bg-[#141e2e]' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Top Row: Category & Checkbox */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                              {attraction.category}
                            </span>
                            {attraction.isDemoFallback && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Demo
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectPoi(attraction.id);
                            }}
                            className={`p-1 rounded-lg transition-colors ${
                              isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Title & Vernacular Name */}
                        <h3 className="font-serif font-bold text-base text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                          {attraction.name}
                        </h3>
                        {attraction.localName && (
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {attraction.localName}
                          </span>
                        )}

                        {/* Description */}
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                          {attraction.description}
                        </p>
                      </div>

                      {/* Bottom Metadata & Actions */}
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{attraction.estimatedDurationMins} mins</span>
                          </div>
                          <div className="font-mono font-semibold text-emerald-300">
                            {attraction.estimatedCostINR === 0 ? 'Free Entry' : `Est. ${formatINR(attraction.estimatedCostINR)}`}
                          </div>
                        </div>

                        {/* External Reference Links (Wikipedia / OSM) */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <div className="flex items-center gap-2">
                            {attraction.wikipedia && (
                              <a
                                href={attraction.wikipedia}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sky-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>Wikipedia</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            <a
                              href={`https://www.openstreetmap.org/${attraction.osmType}/${attraction.osmId}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-white flex items-center gap-0.5 font-mono"
                            >
                              <span>OSM #{attraction.osmId}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>

                          {/* Quick Add to Existing Journey Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) onRequireAuth?.();
                              else setSelectedOsmForAdd(attraction);
                            }}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-emerald-400/20 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            + Add Stop
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Sticky Floating Action Bar when Attractions are selected */}
          {selectedPoiIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121824]/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-4 text-xs animate-slideUp">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-white">
                  {selectedPoiIds.size} {selectedPoiIds.size === 1 ? 'Attraction' : 'Attractions'} Selected
                </span>
              </div>

              <div className="h-4 w-px bg-white/20"></div>

              <button
                onClick={handleLaunchItineraryGenerator}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Multi-Day Itinerary</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ===================== MODE 2: CURATED INDIAN CIRCUITS ===================== */}
      {activeMode === 'curated' && (
        <div className="space-y-6">
          {/* Search & Circuit Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search curated circuits by fort, ghat, or state..."
                value={curatedSearchTerm}
                onChange={(e) => setCuratedSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121824] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
              />
            </div>

            {/* Circuit Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none self-start sm:self-auto">
              {circuits.map((cir) => (
                <button
                  key={cir}
                  onClick={() => setCuratedCircuit(cir)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    curatedCircuit === cir 
                      ? 'bg-emerald-400 text-slate-950 font-semibold shadow-sm' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {cir}
                </button>
              ))}
            </div>
          </div>

          {/* Curated City Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCuratedCities.map((city) => {
              const isSaved = savedCityIds.includes(city.id);

              return (
                <div
                  key={city.id}
                  className="group bg-[#121824] border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  {/* Cover Photo */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={city.image_url}
                      alt={city.city_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-[#121824]/30 to-transparent" />
                    
                    {/* Save Bookmark Button */}
                    <button
                      onClick={() => {
                        if (!isAuthenticated) onRequireAuth?.();
                        else onToggleSaveCity(city.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-[#0b0f17]/80 backdrop-blur-md text-slate-300 hover:text-emerald-400 border border-white/10 transition-colors cursor-pointer"
                      title={isSaved ? 'Remove Bookmark' : 'Save to Profile'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-xs font-mono font-semibold text-emerald-300">
                        Est. {formatINR(city.avg_daily_budget)} / day
                      </span>
                      <h3 className="font-serif font-bold text-xl text-white">
                        {city.city_name}
                      </h3>
                      <span className="text-xs text-slate-300 block">{city.country}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {city.description}
                      </p>

                      <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-white/10">
                        <div>
                          <strong className="text-slate-300">Best Season:</strong> {city.best_season}
                        </div>
                        <div>
                          <strong className="text-slate-300">Vibe:</strong> {city.vibe}
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">Top Sights:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {city.highlights.map((h) => (
                            <span key={h} className="text-[11px] text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!isAuthenticated) onRequireAuth?.();
                          else if (trips.length === 0) onCreateTripWithCity(city);
                          else setSelectedCityForAdd(city);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Journey</span>
                      </button>

                      <button
                        onClick={() => {
                          if (!isAuthenticated) onRequireAuth?.();
                          else onCreateTripWithCity(city);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer"
                        title="Create Brand New Trip Here"
                      >
                        <span>New Trip</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MODAL: MULTI-DAY ITINERARY BUILDER ===================== */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#121824] border border-white/15 rounded-2xl p-6 space-y-5 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-serif font-bold text-white">
                  Build Multi-Day Itinerary ({selectedPoiIds.size} Sights Selected)
                </h3>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300">
              GlobeTrotter will automatically organize your selected OpenStreetMap attractions into balanced morning, afternoon, and sunset time slots with realistic transit buffers and INR budget estimations.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Itinerary Title</label>
                <input
                  type="text"
                  value={planTripTitle}
                  onChange={(e) => setPlanTripTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">End Date</label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Total Budget (Rupees ₹)</label>
                  <input
                    type="number"
                    value={planBudgetINR}
                    onChange={(e) => setPlanBudgetINR(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                  />
                  <span className="text-[11px] text-emerald-400 mt-1 block">
                    Formatted: {formatINR(parseFloat(planBudgetINR) || 0)}
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Travel Pacing</label>
                  <select
                    value={planPacing}
                    onChange={(e: any) => setPlanPacing(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
                  >
                    <option value="relaxed">Relaxed (2 sights/day)</option>
                    <option value="balanced">Balanced (3 sights/day)</option>
                    <option value="fast-paced">Fast-paced (4 sights/day)</option>
                  </select>
                </div>
              </div>

              {/* Selected Sights Preview */}
              <div className="pt-2">
                <span className="text-slate-300 font-semibold block mb-1.5">
                  Selected Attractions Included:
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#0b0f17] border border-white/10">
                  {osmAttractions
                    .filter(a => selectedPoiIds.has(a.id))
                    .map(a => (
                      <div key={a.id} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate pr-2">· {a.name}</span>
                        <span className="text-emerald-400 shrink-0 font-mono">
                          {a.estimatedCostINR === 0 ? 'Free' : formatINR(a.estimatedCostINR)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGeneratedItinerary}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save & Open Workspace</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD SINGLE OSM ATTRACTION TO EXISTING TRIP ===================== */}
      {selectedOsmForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-white">
              Add {selectedOsmForAdd.name} to Itinerary
            </h3>
            
            <p className="text-slate-400">
              Choose which journey to add this OpenStreetMap attraction into.
            </p>

            <div>
              <label className="text-slate-300 block mb-1">Target Journey</label>
              <select
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.start_date})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedOsmForAdd(null)}
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOsmToTripConfirm}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold cursor-pointer shadow-sm"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD CURATED CITY TO TRIP ===================== */}
      {selectedCityForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-white">
              Add {selectedCityForAdd.city_name} to Itinerary
            </h3>
            
            <p className="text-slate-400">
              Select which of your active journeys you would like to append {selectedCityForAdd.city_name} as a new stop.
            </p>

            <div>
              <label className="text-slate-300 block mb-1">Target Journey</label>
              <select
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.start_date})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedCityForAdd(null)}
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedCityForAdd && targetTripId) {
                    onAddCityToTrip(selectedCityForAdd, targetTripId);
                    setSuccessToast(`Added ${selectedCityForAdd.city_name} to your journey!`);
                    setSelectedCityForAdd(null);
                    setTimeout(() => setSuccessToast(null), 3000);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-semibold cursor-pointer shadow-sm"
              >
                Confirm Add Stop
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
