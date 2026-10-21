import { 
  Trip, 
  TripStop, 
  ScheduledActivity, 
  Expense, 
  UserProfile, 
  CityCatalogItem, 
  ActivityCatalogItem,
  RealityCheckFix,
  GeneratedItineraryPlan
} from '../types/travel';
import { 
  DEMO_USER, 
  INITIAL_TRIPS, 
  INITIAL_STOPS, 
  INITIAL_SCHEDULED_ACTIVITIES, 
  INITIAL_EXPENSES, 
  SEED_CITIES, 
  SEED_ACTIVITIES 
} from './seedData';

const STORAGE_KEYS = {
  SESSION: 'gt_session_auth_v1',
  USER: 'gt_user_v2',
  TRIPS: 'gt_trips_v2',
  STOPS: 'gt_stops_v2',
  ACTIVITIES: 'gt_activities_v2',
  EXPENSES: 'gt_expenses_v2',
  CITIES: 'gt_cities_v2',
  CATALOG_ACTIVITIES: 'gt_catalog_acts_v2',
};

class RelationalDatabaseService {
  private user: UserProfile | null;
  private trips: Trip[];
  private stops: TripStop[];
  private activities: ScheduledActivity[];
  private expenses: Expense[];
  private cities: CityCatalogItem[];
  private catalogActivities: ActivityCatalogItem[];

  constructor() {
    // Check if session exists in storage
    const hasSession = this.loadFromStorage<boolean>(STORAGE_KEYS.SESSION, false);
    this.user = hasSession ? this.loadFromStorage<UserProfile>(STORAGE_KEYS.USER, DEMO_USER) : null;
    this.trips = this.loadFromStorage(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    this.stops = this.loadFromStorage(STORAGE_KEYS.STOPS, INITIAL_STOPS);
    this.activities = this.loadFromStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_SCHEDULED_ACTIVITIES);
    this.expenses = this.loadFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    this.cities = this.loadFromStorage(STORAGE_KEYS.CITIES, SEED_CITIES);
    this.catalogActivities = this.loadFromStorage(STORAGE_KEYS.CATALOG_ACTIVITIES, SEED_ACTIVITIES);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // In SSR or restricted storage environments
    }
    return fallback;
  }

  private saveToStorage(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore
    }
  }

  // ---------------- Authentication & Session ----------------
  isAuthenticated(): boolean {
    return this.user !== null;
  }

  getCurrentUser(): UserProfile | null {
    return this.user ? { ...this.user } : null;
  }

  login(email: string, _password?: string): UserProfile {
    // If logging in as demo user or custom email
    const existingUser = this.loadFromStorage<UserProfile>(STORAGE_KEYS.USER, DEMO_USER);
    const userToUse: UserProfile = {
      ...existingUser,
      email: email.trim().toLowerCase(),
      full_name: email.includes('aarav') ? 'Aarav Sharma' : existingUser.full_name || 'Traveler',
    };

    this.user = userToUse;
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.saveToStorage(STORAGE_KEYS.SESSION, true);
    return { ...this.user };
  }

  loginAsDemoUser(): UserProfile {
    this.user = { ...DEMO_USER };
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.saveToStorage(STORAGE_KEYS.SESSION, true);
    return { ...this.user };
  }

  signup(name: string, email: string, _password?: string): UserProfile {
    const newUser: UserProfile = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      full_name: name.trim(),
      avatar_url: '/src/assets/images/avatar_indian_traveler_1792578895981.jpg',
      home_currency: 'INR',
      travel_style: 'Balanced',
      saved_destinations: ['city_varanasi', 'city_udaipur'],
      created_at: new Date().toISOString(),
    };

    this.user = newUser;
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.saveToStorage(STORAGE_KEYS.SESSION, true);
    return { ...this.user };
  }

  logout(): void {
    this.user = null;
    this.saveToStorage(STORAGE_KEYS.SESSION, false);
  }

  updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
    if (!this.user) return null;
    this.user = { ...this.user, ...updates };
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    return { ...this.user };
  }

  toggleSaveDestination(cityId: string): UserProfile | null {
    if (!this.user) return null;
    const isSaved = this.user.saved_destinations.includes(cityId);
    const updated = isSaved
      ? this.user.saved_destinations.filter((id) => id !== cityId)
      : [...this.user.saved_destinations, cityId];
    return this.updateUserProfile({ saved_destinations: updated });
  }

  // ---------------- Trips ----------------
  getTrips(): Trip[] {
    return [...this.trips];
  }

  getTripById(tripId: string): Trip | null {
    const found = this.trips.find((t) => t.id === tripId);
    return found ? { ...found } : null;
  }

  getTripByShareToken(token: string): Trip | null {
    const found = this.trips.find((t) => t.share_token === token || t.id === token);
    return found ? { ...found } : null;
  }

  createTrip(tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_token'>): Trip {
    const id = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const share_token = `gt_share_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const userId = this.user ? this.user.id : DEMO_USER.id;

    const newTrip: Trip = {
      ...tripData,
      id,
      user_id: userId,
      share_token,
      created_at: now,
      updated_at: now,
    };

    this.trips = [newTrip, ...this.trips];
    this.saveToStorage(STORAGE_KEYS.TRIPS, this.trips);
    return newTrip;
  }

  updateTrip(tripId: string, updates: Partial<Trip>): Trip | null {
    const index = this.trips.findIndex((t) => t.id === tripId);
    if (index === -1) return null;

    const updated = {
      ...this.trips[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.trips[index] = updated;
    this.saveToStorage(STORAGE_KEYS.TRIPS, this.trips);
    return { ...updated };
  }

  deleteTrip(tripId: string): boolean {
    // Relational CASCADE DELETE
    this.trips = this.trips.filter((t) => t.id !== tripId);
    this.stops = this.stops.filter((s) => s.trip_id !== tripId);
    this.activities = this.activities.filter((a) => a.trip_id !== tripId);
    this.expenses = this.expenses.filter((e) => e.trip_id !== tripId);

    this.saveToStorage(STORAGE_KEYS.TRIPS, this.trips);
    this.saveToStorage(STORAGE_KEYS.STOPS, this.stops);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    this.saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    return true;
  }

  duplicateTrip(sourceTripId: string): Trip | null {
    const sourceTrip = this.getTripById(sourceTripId);
    if (!sourceTrip) return null;

    const newTripId = `trip_copy_${Date.now()}`;
    const now = new Date().toISOString();
    const userId = this.user ? this.user.id : DEMO_USER.id;

    const clonedTrip: Trip = {
      ...sourceTrip,
      id: newTripId,
      user_id: userId,
      title: `${sourceTrip.title} (My Copy)`,
      share_token: `gt_share_${Math.random().toString(36).substring(2, 9)}`,
      created_at: now,
      updated_at: now,
    };

    // Clone stops and map IDs
    const sourceStops = this.getStopsByTripId(sourceTripId);
    const stopIdMap: Record<string, string> = {};

    const clonedStops: TripStop[] = sourceStops.map((stop) => {
      const newStopId = `stop_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      stopIdMap[stop.id] = newStopId;
      return {
        ...stop,
        id: newStopId,
        trip_id: newTripId,
      };
    });

    // Clone activities
    const sourceActivities = this.getActivitiesByTripId(sourceTripId);
    const clonedActivities: ScheduledActivity[] = sourceActivities.map((act) => ({
      ...act,
      id: `act_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trip_id: newTripId,
      stop_id: stopIdMap[act.stop_id] || act.stop_id,
    }));

    // Clone expenses
    const sourceExpenses = this.getExpensesByTripId(sourceTripId);
    const clonedExpenses: Expense[] = sourceExpenses.map((exp) => ({
      ...exp,
      id: `exp_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trip_id: newTripId,
    }));

    this.trips = [clonedTrip, ...this.trips];
    this.stops = [...this.stops, ...clonedStops];
    this.activities = [...this.activities, ...clonedActivities];
    this.expenses = [...this.expenses, ...clonedExpenses];

    this.saveToStorage(STORAGE_KEYS.TRIPS, this.trips);
    this.saveToStorage(STORAGE_KEYS.STOPS, this.stops);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    this.saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);

    return clonedTrip;
  }

  createFullGeneratedTrip(plan: GeneratedItineraryPlan): Trip {
    const newTrip = this.createTrip(plan.tripData);

    const createdStops: TripStop[] = [];
    for (const stopData of plan.stopsData) {
      const createdStop = this.createStop({
        ...stopData,
        trip_id: newTrip.id,
      });
      createdStops.push(createdStop);
    }

    const defaultStopId = createdStops[0]?.id || '';
    for (const actData of plan.activitiesData) {
      this.addScheduledActivity({
        ...actData,
        trip_id: newTrip.id,
        stop_id: defaultStopId,
      });
    }

    for (const expData of plan.expensesData) {
      this.createExpense({
        ...expData,
        trip_id: newTrip.id,
      });
    }

    return newTrip;
  }

  // ---------------- Trip Stops (Relational 1:N) ----------------
  getStopsByTripId(tripId: string): TripStop[] {
    return this.stops
      .filter((s) => s.trip_id === tripId)
      .sort((a, b) => a.stop_order - b.stop_order);
  }

  addStop(stopData: Omit<TripStop, 'id'>): TripStop {
    const id = `stop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newStop: TripStop = { ...stopData, id };

    this.stops = [...this.stops, newStop];
    this.saveToStorage(STORAGE_KEYS.STOPS, this.stops);
    return newStop;
  }

  createStop(stopData: Omit<TripStop, 'id'>): TripStop {
    return this.addStop(stopData);
  }

  updateStop(stopId: string, updates: Partial<TripStop>): TripStop | null {
    const index = this.stops.findIndex((s) => s.id === stopId);
    if (index === -1) return null;

    const updated = { ...this.stops[index], ...updates };
    this.stops[index] = updated;
    this.saveToStorage(STORAGE_KEYS.STOPS, this.stops);
    return { ...updated };
  }

  deleteStop(stopId: string): boolean {
    // Relational CASCADE: Also delete all activities linked to this stop
    this.stops = this.stops.filter((s) => s.id !== stopId);
    this.activities = this.activities.filter((a) => a.stop_id !== stopId);

    this.saveToStorage(STORAGE_KEYS.STOPS, this.stops);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    return true;
  }

  reorderStops(tripId: string, stopIdsInNewOrder: string[]): TripStop[] {
    stopIdsInNewOrder.forEach((id, index) => {
      const stop = this.stops.find((s) => s.id === id);
      if (stop) {
        stop.stop_order = index + 1;
      }
    });

    this.saveToStorage(STORAGE_KEYS.STOPS, this.stops);
    return this.getStopsByTripId(tripId);
  }

  // ---------------- Scheduled Activities ----------------
  getActivitiesByTripId(tripId: string): ScheduledActivity[] {
    return this.activities
      .filter((a) => a.trip_id === tripId)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      });
  }

  getActivitiesByStopId(stopId: string): ScheduledActivity[] {
    return this.activities
      .filter((a) => a.stop_id === stopId)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      });
  }

  addScheduledActivity(activityData: Omit<ScheduledActivity, 'id'>): ScheduledActivity {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAct: ScheduledActivity = { ...activityData, id };

    this.activities = [...this.activities, newAct];
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    return newAct;
  }

  createScheduledActivity(activityData: Omit<ScheduledActivity, 'id'>): ScheduledActivity {
    return this.addScheduledActivity(activityData);
  }

  updateScheduledActivity(id: string, updates: Partial<ScheduledActivity>): ScheduledActivity | null {
    const index = this.activities.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated = { ...this.activities[index], ...updates };
    this.activities[index] = updated;
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    return { ...updated };
  }

  deleteScheduledActivity(id: string): boolean {
    this.activities = this.activities.filter((a) => a.id !== id);
    this.saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    return true;
  }

  // ---------------- Expenses ----------------
  getExpensesByTripId(tripId: string): Expense[] {
    return this.expenses
      .filter((e) => e.trip_id === tripId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  createExpense(expenseData: Omit<Expense, 'id'>): Expense {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newExp: Expense = { ...expenseData, id };

    this.expenses = [newExp, ...this.expenses];
    this.saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    return newExp;
  }

  deleteExpense(id: string): boolean {
    this.expenses = this.expenses.filter((e) => e.id !== id);
    this.saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    return true;
  }

  // ---------------- Catalogs ----------------
  getCities(): CityCatalogItem[] {
    return [...this.cities];
  }

  getActivityCatalog(): ActivityCatalogItem[] {
    return [...this.catalogActivities];
  }

  // ---------------- Apply Reality Check Fix ----------------
  applyRealityCheckFix(tripId: string, fix: RealityCheckFix): { success: boolean; message: string } {
    const { action_type, payload } = fix;

    if (action_type === 'shift_time') {
      const { activityId, newStartTime, newEndTime } = payload;
      const updated = this.updateScheduledActivity(activityId, {
        start_time: newStartTime,
        end_time: newEndTime,
      });
      if (updated) {
        return {
          success: true,
          message: `Shifted activity schedule to ${newStartTime} - ${newEndTime}`,
        };
      }
    } else if (action_type === 'move_to_day') {
      const { activityId, targetDate, newStartTime, newEndTime } = payload;
      const updated = this.updateScheduledActivity(activityId, {
        date: targetDate,
        ...(newStartTime ? { start_time: newStartTime } : {}),
        ...(newEndTime ? { end_time: newEndTime } : {}),
      });
      if (updated) {
        return {
          success: true,
          message: `Moved activity to ${targetDate} (${newStartTime || 'original time'}) to balance schedule pacing`,
        };
      }
    } else if (action_type === 'swap_cheaper_alternative') {
      const { activityId, replacementTitle, newCost } = payload;
      const act = this.activities.find((a) => a.id === activityId);
      if (act) {
        const diff = act.cost - newCost;
        this.updateScheduledActivity(activityId, {
          activity_title: replacementTitle,
          cost: newCost,
        });
        return {
          success: true,
          message: `Swapped for "${replacementTitle}" (₹${newCost.toLocaleString('en-IN')}), saving ₹${diff.toLocaleString('en-IN')}!`,
        };
      }
    } else if (action_type === 'swap_transit_vande_bharat') {
      const { activityId, replacementTitle, newStartTime, newEndTime, newCost } = payload;
      this.updateScheduledActivity(activityId, {
        activity_title: replacementTitle,
        start_time: newStartTime,
        end_time: newEndTime,
        transit_mode: 'Vande Bharat Express',
        ...(newCost ? { cost: newCost } : {}),
      });
      return {
        success: true,
        message: `Upgraded to Vande Bharat Express (${newStartTime} - ${newEndTime}) with reserved chair car comfort!`,
      };
    } else if (action_type === 'adjust_darshan_window') {
      const { activityId, newStartTime, newEndTime, titlePrefix } = payload;
      const act = this.activities.find((a) => a.id === activityId);
      this.updateScheduledActivity(activityId, {
        start_time: newStartTime,
        end_time: newEndTime,
        ...(titlePrefix && act ? { activity_title: `${titlePrefix} ${act.activity_title}` } : {}),
      });
      return {
        success: true,
        message: `Aligned darshan slot to auspicious open kapaat hours (${newStartTime} - ${newEndTime})`,
      };
    } else if (action_type === 'adjust_budget') {
      const { newBudget } = payload;
      this.updateTrip(tripId, { total_budget: newBudget });
      return {
        success: true,
        message: `Trip budget successfully updated to ₹${newBudget.toLocaleString('en-IN')}`,
      };
    } else if (action_type === 'mark_optional') {
      const { activityId } = payload;
      this.updateScheduledActivity(activityId, { is_optional: true });
      return {
        success: true,
        message: 'Marked activity as optional with flexible time window',
      };
    }

    return { success: false, message: 'Could not apply selected fix' };
  }

  // ---------------- Reset Data ----------------
  resetToSeedData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.STOPS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CITIES);
    localStorage.removeItem(STORAGE_KEYS.CATALOG_ACTIVITIES);

    this.user = DEMO_USER;
    this.trips = INITIAL_TRIPS;
    this.stops = INITIAL_STOPS;
    this.activities = INITIAL_SCHEDULED_ACTIVITIES;
    this.expenses = INITIAL_EXPENSES;
    this.cities = SEED_CITIES;
    this.catalogActivities = SEED_ACTIVITIES;
  }

  // ---------------- Platform Aggregate Analytics (Screen #13) ----------------
  getPlatformAnalytics() {
    const totalTrips = this.trips.length;
    const totalStops = this.stops.length;
    const totalActivities = this.activities.length;
    const totalExpenses = this.expenses.length;
    const totalBudgetManaged = this.trips.reduce((sum, t) => sum + (t.total_budget || 0), 0);
    const totalSpent = this.expenses.reduce((sum, e) => sum + (e.amount || 0), 0) +
                       this.activities.reduce((sum, a) => sum + (a.cost || 0), 0);

    // City frequency
    const cityCounts: Record<string, number> = {};
    this.stops.forEach((s) => {
      cityCounts[s.city_name] = (cityCounts[s.city_name] || 0) + 1;
    });

    const topCities = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Category spending breakdown
    const categorySpending: Record<string, number> = {
      Transport: 0,
      Accommodation: 0,
      Food: 0,
      Activities: 0,
      Miscellaneous: 0,
    };

    this.expenses.forEach((e) => {
      categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
    });
    this.activities.forEach((a) => {
      if (a.category === 'Transit') categorySpending.Transport += a.cost;
      else if (a.category === 'Culinary') categorySpending.Food += a.cost;
      else categorySpending.Activities += a.cost;
    });

    return {
      totalTrips,
      totalStops,
      totalActivities,
      totalExpenses,
      totalBudgetManaged,
      totalSpent,
      topCities,
      categorySpending,
      realityCheckStats: {
        totalAudited: totalTrips,
        overallFeasibilityRate: 92.4,
        avgIssuesPerTrip: 2.3,
        autoFixedCount: 18,
      },
    };
  }

  // ---------------- SQL Schema Documentation for Supabase / PostgreSQL ----------------
  getPostgreSqlSchemaDefinition(): string {
    return `-- =======================================================
-- GlobeTrotter Relational Schema for PostgreSQL / Supabase
-- Indian Travel Operating System
-- =======================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  home_currency VARCHAR(8) DEFAULT 'INR',
  travel_style VARCHAR(32) DEFAULT 'Balanced',
  saved_destinations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trips Table (1:N with Users)
CREATE TABLE IF NOT EXISTS public.trips (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination_summary TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  cover_image TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Trip Stops / Cities Table (1:N with Trips)
CREATE TABLE IF NOT EXISTS public.trip_stops (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  city_name VARCHAR(128) NOT NULL,
  country VARCHAR(128) NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  stop_order INTEGER NOT NULL,
  accommodation_name VARCHAR(255),
  estimated_lodging_cost NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  image_url TEXT
);

-- 4. Scheduled Activities Table (1:N with Trip Stops)
CREATE TABLE IF NOT EXISTS public.scheduled_activities (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  stop_id VARCHAR(64) NOT NULL REFERENCES public.trip_stops(id) ON DELETE CASCADE,
  activity_title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  start_time VARCHAR(8) NOT NULL,
  end_time VARCHAR(8) NOT NULL,
  cost NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'INR',
  location_zone VARCHAR(128),
  is_optional BOOLEAN DEFAULT false,
  status VARCHAR(32) DEFAULT 'planned',
  transit_mode VARCHAR(64)
);

-- 5. Expenses Table (1:N with Trips)
CREATE TABLE IF NOT EXISTS public.expenses (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  date DATE NOT NULL,
  description TEXT,
  paid_by VARCHAR(64)
);
`;
  }
}

export const db = new RelationalDatabaseService();
