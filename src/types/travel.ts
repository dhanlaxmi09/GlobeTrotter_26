export type ActivityCategory = 
  | 'Sightseeing'
  | 'Cultural'
  | 'Culinary'
  | 'Adventure'
  | 'Relaxation'
  | 'Transit'
  | 'Entertainment';

export type ExpenseCategory = 
  | 'Transport'
  | 'Accommodation'
  | 'Food'
  | 'Activities'
  | 'Miscellaneous';

export type TravelStyle = 'Relaxed' | 'Balanced' | 'Fast-paced' | 'Luxury' | 'Backpacker';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  home_currency: string;
  travel_style: TravelStyle;
  saved_destinations: string[]; // city names or IDs
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination_summary: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_budget: number;
  currency: string;
  cover_image: string;
  description: string;
  is_public: boolean;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface TripStop {
  id: string;
  trip_id: string;
  city_name: string;
  country: string;
  arrival_date: string; // YYYY-MM-DD
  departure_date: string; // YYYY-MM-DD
  stop_order: number;
  accommodation_name: string;
  estimated_lodging_cost: number;
  notes?: string;
  image_url?: string;
}

export interface ActivityCatalogItem {
  id: string;
  title: string;
  city: string;
  country: string;
  region: 'Asia' | 'Europe' | 'Americas' | 'Africa' | 'Oceania' | 'Middle East';
  category: ActivityCategory;
  duration_mins: number;
  estimated_cost: number;
  currency: string;
  description: string;
  image_url: string;
  optimal_time_of_day: 'Morning' | 'Afternoon' | 'Sunset' | 'Evening' | 'Anytime';
  physical_intensity: 'Low' | 'Moderate' | 'High';
  zone: string;
  rating: number;
  reviews_count: number;
  transit_type?: string; // e.g. "Vande Bharat Express", "Private Auto", "Shikara Boat"
}

export interface ScheduledActivity {
  id: string;
  trip_id: string;
  stop_id: string;
  activity_title: string;
  category: ActivityCategory;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  cost: number;
  currency: string;
  location_zone: string;
  is_optional: boolean;
  notes?: string;
  status: 'planned' | 'completed' | 'skipped';
  catalog_id?: string;
  transit_mode?: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  description: string;
  paid_by?: string;
}

export type RealityCheckSeverity = 'critical' | 'warning' | 'suggestion';

export type RealityCheckType = 
  | 'overlap'
  | 'overcrowded_day'
  | 'transit_buffer'
  | 'date_inconsistency'
  | 'budget_exceeded'
  | 'daily_budget_spike'
  | 'irctc_transit_impossible'
  | 'temple_timing_conflict'
  | 'monsoon_weather_hazard';

export interface RealityCheckFix {
  label: string;
  explanation: string;
  action_type: 
    | 'shift_time'
    | 'move_to_day'
    | 'swap_cheaper_alternative'
    | 'adjust_stop_dates'
    | 'mark_optional'
    | 'adjust_budget'
    | 'swap_transit_vande_bharat'
    | 'adjust_darshan_window';
  payload: any;
}

export interface RealityCheckIssue {
  id: string;
  type: RealityCheckType;
  severity: RealityCheckSeverity;
  title: string;
  description: string;
  affected_date?: string;
  affected_activity_ids?: string[];
  suggested_fix?: RealityCheckFix;
}

export interface CityCatalogItem {
  id: string;
  city_name: string;
  country: string;
  region: 'Asia' | 'Europe' | 'Americas' | 'Africa' | 'Oceania' | 'Middle East';
  description: string;
  image_url: string;
  avg_daily_budget: number;
  currency: string;
  best_season: string;
  highlights: string[];
  vibe: string;
  state?: string;
}

/**
 * Formats a numerical amount into Indian Rupee (INR ₹) standard format.
 * Uses Indian numbering with Lakhs and Crores (e.g. ₹1,50,000 or ₹1.5 L)
 */
export function formatINR(
  amount: number, 
  options?: { compact?: boolean; hideSymbol?: boolean }
): string {
  const symbol = options?.hideSymbol ? '' : '₹';
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  
  if (options?.compact) {
    const abs = Math.abs(amount);
    if (abs >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
    }
    if (abs >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(1).replace(/\.0$/, '')} L`;
    }
    if (abs >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1).replace(/\.0$/, '')} k`;
    }
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return `${symbol}${formatted}`;
}

export type OsmAttractionCategory = 
  | 'All' 
  | 'Historic & Heritage' 
  | 'Culture & Temples' 
  | 'Nature & Parks' 
  | 'Viewpoints' 
  | 'Leisure & Sights';

export interface OsmAttraction {
  id: string;
  osmId: number;
  osmType: 'node' | 'way' | 'relation';
  name: string;
  localName?: string;
  category: OsmAttractionCategory;
  rawType: string;
  lat: number;
  lon: number;
  description: string;
  website?: string;
  wikipedia?: string;
  openingHours?: string;
  estimatedDurationMins: number;
  estimatedCostINR: number;
  isDemoFallback?: boolean;
}

export interface DestinationGeoInfo {
  query: string;
  displayName: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string];
}

export interface GeneratedItineraryPlan {
  tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_token'>;
  stopsData: Array<Omit<TripStop, 'id' | 'trip_id'>>;
  activitiesData: Array<Omit<ScheduledActivity, 'id' | 'trip_id' | 'stop_id'>>;
  expensesData: Array<Omit<Expense, 'id' | 'trip_id'>>;
}
