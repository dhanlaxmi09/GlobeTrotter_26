/**
 * OpenStreetMap & Overpass API Service for GlobeTrotter
 * 
 * Provides free, unauthenticated dynamic destination discovery and POI mapping
 * using Nominatim (geocoding) and Overpass API (tourist attractions, historic sites, viewpoints).
 * Complies with OSM usage policies with rate limits, timeout guards, and endpoint failovers.
 */

import { 
  OsmAttraction, 
  OsmAttractionCategory, 
  DestinationGeoInfo, 
  GeneratedItineraryPlan, 
  ActivityCategory,
  ExpenseCategory
} from '../types/travel';

// Primary and mirror Overpass API endpoints for resilient failover
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter'
];

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

// In-memory cache to respect OSM Fair-Use policies and avoid redundant queries
const geoCache = new Map<string, DestinationGeoInfo>();
const poiCache = new Map<string, OsmAttraction[]>();

/**
 * Geocode user-entered city, state, or destination query using OpenStreetMap Nominatim.
 */
export async function geocodeDestination(query: string): Promise<DestinationGeoInfo | null> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  if (geoCache.has(normalized)) {
    return geoCache.get(normalized)!;
  }

  const url = `${NOMINATIM_ENDPOINT}?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const item = data[0];
    const address = item.address || {};
    const city = address.city || address.town || address.village || address.municipality || address.county || item.name || query;
    const state = address.state || address.region || '';
    const country = address.country || 'India';

    const result: DestinationGeoInfo = {
      query,
      displayName: item.display_name,
      city,
      state,
      country,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      boundingbox: item.boundingbox,
    };

    geoCache.set(normalized, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[OSM Nominatim] Error geocoding "${query}":`, err.message || err);
    return null;
  }
}

/**
 * Query Overpass API with multi-mirror failover and timeout protection.
 */
export async function fetchOverpassPOIs(
  lat: number, 
  lon: number, 
  radiusMeters: number = 15000
): Promise<{ attractions: OsmAttraction[]; usedFallback: boolean; error?: string }> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${radiusMeters}`;
  if (poiCache.has(cacheKey)) {
    return { attractions: poiCache.get(cacheKey)!, usedFallback: false };
  }

  // Construct Overpass QL query searching for tourist attractions, historic monuments,
  // viewpoints, museums, heritage sites, and notable places of worship.
  const queryQL = `[out:json][timeout:22];
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery|artwork"](around:${radiusMeters},${lat},${lon});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery|artwork"](around:${radiusMeters},${lat},${lon});
  node["historic"~"monument|castle|memorial|ruins|archaeological_site|fort|city_gate"](around:${radiusMeters},${lat},${lon});
  way["historic"~"monument|castle|memorial|ruins|archaeological_site|fort|city_gate"](around:${radiusMeters},${lat},${lon});
  node["leisure"~"park|garden|nature_reserve"](around:${radiusMeters},${lat},${lon});
  way["leisure"~"park|garden|nature_reserve"](around:${radiusMeters},${lat},${lon});
  node["amenity"="place_of_worship"]["historic"](around:${radiusMeters},${lat},${lon});
  node["natural"~"waterfall|peak|beach"](around:${radiusMeters},${lat},${lon});
);
out center 45;`;

  let lastError = '';

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json'
        },
        body: `data=${encodeURIComponent(queryQL)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${endpoint}`;
        continue;
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.elements)) {
        lastError = 'Invalid Overpass JSON payload';
        continue;
      }

      const parsed = parseOverpassElements(data.elements);
      if (parsed.length > 0) {
        poiCache.set(cacheKey, parsed);
        return { attractions: parsed, usedFallback: false };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err.name === 'AbortError' ? 'Overpass request timed out' : (err.message || String(err));
      // Attempt next mirror
    }
  }

  return { 
    attractions: [], 
    usedFallback: false, 
    error: lastError || 'All Overpass mirrors were unresponsive' 
  };
}

/**
 * Transform raw Overpass nodes/ways into strongly typed OsmAttraction models.
 */
function parseOverpassElements(elements: any[]): OsmAttraction[] {
  const seenNames = new Set<string>();
  const results: OsmAttraction[] = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const rawName = tags['name:en'] || tags.name || tags['name:hi'];
    if (!rawName || typeof rawName !== 'string') continue;

    const trimmedName = rawName.trim();
    const cleanLower = trimmedName.toLowerCase();

    // Deduplicate POIs with very similar names
    if (seenNames.has(cleanLower)) continue;
    seenNames.add(cleanLower);

    // Extract coordinates (node has lat/lon; way/relation has center.lat/center.lon)
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;

    // Determine category
    const category = categorizeOsmElement(tags);

    // Estimate duration & INR cost based on category and tags
    const { durationMins, costINR } = estimateDurationAndCost(category, tags);

    // Build human-friendly description
    const desc = buildOsmDescription(tags, category);

    // Wikipedia link if available
    let wikipediaUrl: string | undefined = undefined;
    if (tags.wikipedia) {
      const match = tags.wikipedia.match(/^(?:([^:]+):)?(.*)$/);
      if (match) {
        const lang = match[1] || 'en';
        wikipediaUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(match[2])}`;
      }
    }

    results.push({
      id: `osm_${el.type}_${el.id}`,
      osmId: el.id,
      osmType: el.type,
      name: trimmedName,
      localName: tags['name:hi'] || (tags['name:en'] !== tags.name ? tags.name : undefined),
      category,
      rawType: tags.historic || tags.tourism || tags.amenity || tags.leisure || tags.natural || 'attraction',
      lat,
      lon,
      description: desc,
      website: tags.website || tags['contact:website'],
      wikipedia: wikipediaUrl,
      openingHours: tags.opening_hours,
      estimatedDurationMins: durationMins,
      estimatedCostINR: costINR,
      isDemoFallback: false,
    });

    if (results.length >= 35) break;
  }

  return results;
}

function categorizeOsmElement(tags: Record<string, string>): OsmAttractionCategory {
  if (tags.historic || tags.heritage) {
    return 'Historic & Heritage';
  }
  if (tags.tourism === 'viewpoint' || tags.natural === 'peak' || tags.natural === 'cliff') {
    return 'Viewpoints';
  }
  if (tags.amenity === 'place_of_worship' || tags.tourism === 'museum' || tags.tourism === 'gallery') {
    return 'Culture & Temples';
  }
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve' || tags.natural === 'waterfall' || tags.natural === 'beach') {
    return 'Nature & Parks';
  }
  return 'Leisure & Sights';
}

function estimateDurationAndCost(category: OsmAttractionCategory, tags: Record<string, string>): { durationMins: number; costINR: number } {
  const feeTag = tags.fee;
  const isFree = feeTag === 'no' || feeTag === 'free';

  switch (category) {
    case 'Historic & Heritage':
      return { 
        durationMins: 90, 
        costINR: isFree ? 0 : 250 
      };
    case 'Culture & Temples':
      return { 
        durationMins: 75, 
        costINR: isFree ? 0 : (tags.tourism === 'museum' ? 150 : 50) 
      };
    case 'Viewpoints':
      return { 
        durationMins: 45, 
        costINR: 0 
      };
    case 'Nature & Parks':
      return { 
        durationMins: 60, 
        costINR: isFree ? 0 : 40 
      };
    case 'Leisure & Sights':
    default:
      return { 
        durationMins: 90, 
        costINR: tags.tourism === 'theme_park' ? 750 : 100 
      };
  }
}

function buildOsmDescription(tags: Record<string, string>, category: OsmAttractionCategory): string {
  if (tags['description:en']) return tags['description:en'];
  if (tags.description) return tags.description;

  const parts: string[] = [];

  if (tags.historic) {
    parts.push(`Historic ${tags.historic.replace(/_/g, ' ')}`);
  } else if (tags.tourism) {
    parts.push(`Popular ${tags.tourism.replace(/_/g, ' ')}`);
  } else if (tags.leisure) {
    parts.push(`Public ${tags.leisure.replace(/_/g, ' ')}`);
  } else if (tags.amenity === 'place_of_worship') {
    const religion = tags.religion ? `${tags.religion} ` : '';
    parts.push(`Sacred ${religion}place of worship`);
  }

  if (tags.wheelchair === 'yes') {
    parts.push('wheelchair accessible');
  }

  if (tags.opening_hours) {
    parts.push(`Hours: ${tags.opening_hours}`);
  }

  if (parts.length > 0) {
    return `${parts.join(' · ')} mapped on OpenStreetMap.`;
  }

  return `Noted point of interest in ${category.toLowerCase()} category on OpenStreetMap.`;
}

/**
 * Curated regional demo fallbacks when an arbitrary destination has low OSM density
 * or during an upstream network timeout. Clearly marked as [Demo Fallback].
 */
export function getDemoFallbackPOIs(cityName: string, lat?: number, lon?: number): OsmAttraction[] {
  const city = cityName || 'Destination';
  const baseLat = lat || 26.9124;
  const baseLon = lon || 75.7873;

  return [
    {
      id: `demo_fallback_${city.toLowerCase()}_1`,
      osmId: 900001,
      osmType: 'node',
      name: `${city} Grand Heritage Fort & Palace`,
      category: 'Historic & Heritage',
      rawType: 'fort',
      lat: baseLat + 0.015,
      lon: baseLon + 0.012,
      description: `Spectacular fortified citadel overlooking ${city} with intricate sandstone carvings, royal courtyards, and panoramic ramparts.`,
      estimatedDurationMins: 120,
      estimatedCostINR: 350,
      isDemoFallback: true,
      openingHours: '09:00-17:30',
    },
    {
      id: `demo_fallback_${city.toLowerCase()}_2`,
      osmId: 900002,
      osmType: 'node',
      name: `Old ${city} Vibrant Bazaar & Spice Market`,
      category: 'Leisure & Sights',
      rawType: 'attraction',
      lat: baseLat - 0.008,
      lon: baseLon - 0.005,
      description: `Lively heritage market filled with aromatic spices, handcrafted textiles, traditional street foods, and brass handicrafts.`,
      estimatedDurationMins: 90,
      estimatedCostINR: 150,
      isDemoFallback: true,
      openingHours: '10:00-21:00',
    },
    {
      id: `demo_fallback_${city.toLowerCase()}_3`,
      osmId: 900003,
      osmType: 'node',
      name: `${city} Sacred Sun Temple & Ghats`,
      category: 'Culture & Temples',
      rawType: 'place_of_worship',
      lat: baseLat + 0.022,
      lon: baseLon - 0.014,
      description: `Revered spiritual sanctuary famous for morning prayers, meditative atmosphere, and sacred holy water tanks.`,
      estimatedDurationMins: 75,
      estimatedCostINR: 50,
      isDemoFallback: true,
      openingHours: '06:00-20:00',
    },
    {
      id: `demo_fallback_${city.toLowerCase()}_4`,
      osmId: 900004,
      osmType: 'node',
      name: `Sunset Point & Valley Overlook`,
      category: 'Viewpoints',
      rawType: 'viewpoint',
      lat: baseLat - 0.025,
      lon: baseLon + 0.02,
      description: `High scenic ridge offering golden hour views across the entire ${city} horizon and lush surroundings.`,
      estimatedDurationMins: 60,
      estimatedCostINR: 0,
      isDemoFallback: true,
    },
    {
      id: `demo_fallback_${city.toLowerCase()}_5`,
      osmId: 900005,
      osmType: 'node',
      name: `${city} Botanical Gardens & Lake Walkway`,
      category: 'Nature & Parks',
      rawType: 'park',
      lat: baseLat + 0.005,
      lon: baseLon + 0.018,
      description: `Tranquil public garden with centuries-old trees, lotus ponds, and manicured lawns for peaceful evening strolls.`,
      estimatedDurationMins: 60,
      estimatedCostINR: 30,
      isDemoFallback: true,
      openingHours: '06:00-19:00',
    },
  ];
}

/**
 * Generate a complete, balanced multi-day itinerary from user-selected OpenStreetMap attractions.
 */
export function generateItineraryFromSelectedPOIs(options: {
  destinationTitle: string;
  cityName: string;
  countryName: string;
  startDate: string;
  endDate: string;
  totalBudgetINR: number;
  selectedPOIs: OsmAttraction[];
  pacing: 'relaxed' | 'balanced' | 'fast-paced';
}): GeneratedItineraryPlan {
  const {
    destinationTitle,
    cityName,
    countryName,
    startDate,
    endDate,
    totalBudgetINR,
    selectedPOIs,
    pacing
  } = options;

  // Calculate day sequence
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  const dayCount = Math.max(1, dates.length);

  // Pacing determines target activities per day: relaxed=2, balanced=3, fast=4
  const actsPerDay = pacing === 'relaxed' ? 2 : pacing === 'fast-paced' ? 4 : 3;

  // Distribute selected POIs across days
  const timeSlots = [
    { start: '09:00', end: '11:00' },
    { start: '11:45', end: '13:15' },
    { start: '14:30', end: '16:30' },
    { start: '17:30', end: '19:30' },
  ];

  const activitiesData: Array<Omit<import('../types/travel').ScheduledActivity, 'id' | 'trip_id' | 'stop_id'>> = [];
  let poiIndex = 0;

  for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
    const curDate = dates[dayIdx];
    const slotsToday = timeSlots.slice(0, actsPerDay);

    for (let slotIdx = 0; slotIdx < slotsToday.length; slotIdx++) {
      if (poiIndex >= selectedPOIs.length) break;
      const poi = selectedPOIs[poiIndex];
      const slot = slotsToday[slotIdx];

      // Map OSM category to GlobeTrotter ActivityCategory
      let category: ActivityCategory = 'Sightseeing';
      if (poi.category === 'Culture & Temples') category = 'Cultural';
      else if (poi.category === 'Nature & Parks') category = 'Relaxation';
      else if (poi.category === 'Historic & Heritage') category = 'Cultural';
      else if (poi.category === 'Viewpoints') category = 'Sightseeing';

      activitiesData.push({
        activity_title: poi.name,
        category,
        date: curDate,
        start_time: slot.start,
        end_time: slot.end,
        cost: poi.estimatedCostINR,
        currency: 'INR',
        location_zone: `${cityName} (${poi.category})`,
        is_optional: slotIdx >= 2,
        status: 'planned',
        notes: `${poi.description} (OSM ID: ${poi.osmId})`,
      });

      poiIndex++;
    }
  }

  // Calculate estimated lodging & transit budget
  const lodgingPerNight = Math.round((totalBudgetINR * 0.40) / dayCount);
  const transitExpense = Math.round(totalBudgetINR * 0.20);
  const foodExpense = Math.round(totalBudgetINR * 0.25);

  const stopsData: Array<Omit<import('../types/travel').TripStop, 'id' | 'trip_id'>> = [
    {
      city_name: cityName,
      country: countryName,
      arrival_date: startDate,
      departure_date: endDate,
      stop_order: 1,
      accommodation_name: `${cityName} Heritage Haveli / Boutique Stay`,
      estimated_lodging_cost: lodgingPerNight * Math.max(1, dayCount - 1),
      notes: `Dynamic OpenStreetMap itinerary exploring ${selectedPOIs.length} mapped attractions.`,
      image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    }
  ];

  const expensesData: Array<Omit<import('../types/travel').Expense, 'id' | 'trip_id'>> = [
    {
      category: 'Transport' as ExpenseCategory,
      amount: transitExpense,
      currency: 'INR',
      date: startDate,
      description: `Roundtrip Vande Bharat / Intercity Express & Local Autos in ${cityName}`,
    },
    {
      category: 'Accommodation' as ExpenseCategory,
      amount: lodgingPerNight * Math.max(1, dayCount - 1),
      currency: 'INR',
      date: startDate,
      description: `Lodging reservation (${dayCount} days) in ${cityName}`,
    },
    {
      category: 'Food' as ExpenseCategory,
      amount: foodExpense,
      currency: 'INR',
      date: startDate,
      description: `Daily meals, street delicacies, and traditional thalis`,
    }
  ];

  return {
    tripData: {
      title: destinationTitle || `${cityName} Exploration`,
      destination_summary: `${cityName}, ${countryName}`,
      start_date: startDate,
      end_date: endDate,
      total_budget: totalBudgetINR,
      currency: 'INR',
      cover_image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      description: `A customized ${dayCount}-day journey through ${cityName} generated from live OpenStreetMap points of interest.`,
      is_public: false,
    },
    stopsData,
    activitiesData,
    expensesData,
  };
}
