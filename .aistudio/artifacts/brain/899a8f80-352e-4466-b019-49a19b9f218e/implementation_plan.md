# GlobeTrotter: Authenticated Indian Travel Platform & Complete 13-Screen Operating System

Establish a structured user journey featuring a cinematic public landing page, a dedicated authentication gateway (Login / Signup), and a personalized post-login travel management hub. No private trip plans or itineraries will be exposed prior to authentication. The system implements all 13 requested screens with relational data persistence, Indian travel circuits, and Rupee (₹) formatting.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The plan has been revised to incorporate the strict authentication workflow and the complete 13-screen architecture:

- **Strict Access Gating (Landing → Auth → Personalized Experience)**:
  - *Public Experience*: Unauthenticated users can view the cinematic Landing Hero & showcase, explore public Indian destination catalogs, and inspect public shared itineraries.
  - *Authentication Gate*: Dedicated Login / Signup screen with email/password validation, demo quick-login, and forgot password flow.
  - *Private Hub*: All personal trips, itinerary builders, timelines, budget ledgers, reality check consoles, and profile settings are locked behind authentication and tied to the active user's ID.
- **Complete 13-Screen Suite**:
  1. *Login / Signup Screen*: Secure entry with validation, password recovery, and demo account selector.
  2. *Dashboard / Home Screen*: Personalized welcome banner, active trip cards, Indian recommendations, and budget health highlights.
  3. *Create Trip Screen*: Modal/form with name, dates, description, cover photo presets (Rajasthan, Ladakh, Kerala, Varanasi, Goa), and INR budget.
  4. *My Trips (Trip List) Screen*: Grid/list with search, destination count, status badges, and 1-click clone/delete.
  5. *Itinerary Builder Screen*: Multi-city stops, city reordering, activity scheduling, and cost estimation.
  6. *Itinerary View Screen*: Day-by-day itinerary with dual List/Calendar toggle and activity details.
  7. *City Search & Discovery*: Indian destination search filtered by region, cost index, and seasonal highlights.
  8. *Activity Search & Discovery*: Curated experiences filtered by category, duration, and intensity with 1-click schedule.
  9. *Trip Budget & Cost Breakdown*: Breakdown by Transport, Stay, Activities, and Meals with visual charts, daily averages, and Rupee overbudget alerts.
  10. *Trip Calendar & Timeline*: Visual chronological schedule with buffer indicators and conflict detection.
  11. *Shared / Public Itinerary View*: Public read-only page with social share and "Copy Trip" button.
  12. *User Profile & Settings*: Traveler details, travel pacing style, INR currency setting, saved bucket list, and PostgreSQL schema inspector.
  13. *Admin & Analytics Dashboard*: Platform statistics, total trips, popular Indian destinations, budget distribution, and Reality Check resolution rates.
- **Indian Locale & Logistics**:
  - Rupee (`₹`) formatted with Indian numbering (Lakhs and thousands, e.g., `₹1,50,000`).
  - Reality Check verifies Indian Railways / Vande Bharat transit buffers, temple aarti & darshan timings, and seasonal monsoon/snow warnings.

---

## 1. Overview & Core Concept

- **What It Does**: GlobeTrotter is a full-featured travel planning platform tailored for Indian journeys. Visitors explore cinematic destinations on the landing page and authenticate to unlock an individualized workspace where multi-city itineraries, day-by-day schedules, expenses, and travel feasibility checks are safely organized in a relational data structure.
- **Target Audience / Persona**: Travelers planning multi-city Indian journeys who require realistic scheduling, budget transparency, and shareable plans.
- **Key Value**: Provides a realistic, protected itinerary workspace that validates travel feasibility (transit hours, temple hours, climate) before money is spent.

---

## 2. User Experience & Navigation Flow

### Unauthenticated Visitor Flow

```
[Public Landing Page] ──► [City Discovery (Public)]
        │
        ▼ (Click "Plan Trip", "Dashboard", or "Sign In")
[Dedicated Login / Signup Screen]
        │
        ├── Email / Password Validation
        ├── Demo 1-Click Persona Login (Aarav Sharma)
        └── Forgot Password Modal
```

### Authenticated Traveler Flow

```
                 [Authenticated Session]
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
[Dashboard]            [My Trips]          [City & Activity]
 - Welcome message      - Filter / Search   - Search & Add
 - Active trip stats    - Create Trip       - Filter by region
 - Budget summary       - Clone / Delete    - Indian highlights
      │                     │
      └──────────┬──────────┘
                 ▼
        [Trip Workspace Hub]
         ├── 1. Itinerary Builder (Stops & Cities)
         ├── 2. Itinerary View (Day-wise / Calendar)
         ├── 3. Timeline / Calendar (Hour-by-hour)
         ├── 4. Trip Reality Check (IRCTC / Aarti / Monsoon)
         ├── 5. Budget & Cost Breakdown (Charts in INR)
         └── 6. Share & Export (Public link & Copy)
                 │
                 ▼
        [Profile & Settings] / [Admin Analytics]
```

### Screen-by-Screen Experience

1. **Login / Signup**: Elegant authentication view with tabbed Login/Register forms, instant demo credentials button, password visibility toggle, and error messaging.
2. **Dashboard**: Greets the logged-in traveler by name, shows key metrics (Upcoming Trips, Total Travel Days, Budget Utilization), spotlights their primary active trip with feasibility score, and presents recommended Indian destinations.
3. **Create Trip**: Form with validation, start/end dates, INR budget input with auto-formatting, cover image presets for iconic Indian destinations, and optional description.
4. **My Trips**: Displays the traveler's saved trips in grid/list format with search and filter controls (All, Upcoming, Public), city counts, and cascade deletion protection.
5. **Itinerary Builder**: Multi-city stop manager where stops can be added, reordered up/down, lodging assigned with cost, and activities attached per city.
6. **Itinerary View**: Day-wise layout with time badges, cost tags, location details, and a toggle between structured list and visual day cards.
7. **City Search**: Indian cities (Rajasthan, Ladakh, Kerala, Varanasi, Goa, Rishikesh) with search, regional filters, average daily budget in INR, and 1-click "Add to Trip".
8. **Activity Search**: Experiences categorized into Sightseeing, Cultural, Culinary, Adventure, and Relaxation with intensity ratings and scheduling modal.
9. **Trip Budget**: Progress bar of spent vs. allocated INR budget, category breakdown with bar graphs, daily average expenditure, and warning banners for overbudget days.
10. **Calendar / Timeline**: Chronological visual timeline depicting daily activities, transit blocks, and free-time buffer gaps.
11. **Shared / Public Itinerary View**: Read-only public showcase with interactive summary, activity timeline, and a "Fork / Copy Trip to My Account" button.
12. **User Profile & Settings**: Update name, email, travel style (Relaxed, Balanced, Fast-Paced), default currency (INR), and inspect the relational PostgreSQL DDL.
13. **Admin Analytics**: Accessible from navigation for platform insights, displaying total trips, top booked cities, average spend distribution, and Reality Check resolution metrics.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Explicit Authentication State & Session Gate**
  - *Chosen Approach*: Track `isAuthenticated` state in relational database store. When unauthenticated, navigation to private routes (`dashboard`, `trips`, `trip_workspace`, `settings`, `admin`) automatically redirects to the dedicated `login` view.
  - *Why*: Satisfies user request that no trip plan details or private workspaces are shown prior to login.
  - *Alternatives Considered*: Modal overlay only; rejected in favor of a dedicated full-screen login/signup view with clear navigation back to the landing page.

- **Decision 2: Relational Foreign Key Integrity with Cascade Operations**
  - *Chosen Approach*: `Trip` owns `TripStop`s (1:N), `TripStop` owns `ScheduledActivity`s (1:N), and `Trip` owns `Expense`s (1:N). Deleting or duplicating a trip automatically cascades to all associated stops, activities, and expenses.
  - *Why*: Ensures strict relational database architecture and clean data hygiene without orphan records.

- **Decision 3: Indian Currency (`₹`) & Cultural Logistics**
  - *Chosen Approach*: Format all monetary values using `en-IN` Lakhs/Thousands notation (`₹1,50,000`). Integrate Indian Railways (Vande Bharat/Sleeper) transit duration rules, Varanasi Ganga Aarti / temple darshan timing checks, and seasonal monsoon alerts into the Trip Reality Check engine.

---

## 4. Technical Architecture & Data Strategy

### Component & Data Architecture

```
┌────────────────────────────────────────────────────────┐
│                   App.tsx (Root State)                 │
│  - currentUser: UserProfile | null                     │
│  - isAuthenticated: boolean                            │
│  - activeView: 'landing' | 'login' | 'dashboard' | ...  │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
  [Unauthenticated]                     [Authenticated]
         │                                     │
         ├── LandingHero & Features            ├── DashboardView
         ├── Login / Signup Screen             ├── TripsListView
         ├── CityDiscoveryView (Browse)        ├── CreateTripModal
         └── PublicTripView (Read-only)        ├── TripWorkspace
                                               │   ├── ItineraryBuilder
                                               │   ├── ItineraryView
                                               │   ├── TimelineView
                                               │   ├── RealityCheckConsole
                                               │   └── BudgetLedger
                                               ├── ActivityDiscoveryView
                                               ├── ProfileSettingsView
                                               └── AdminAnalyticsView
```

### Relational Database Schema (PostgreSQL-aligned)

```sql
-- Users Table
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  home_currency VARCHAR(8) DEFAULT 'INR',
  travel_style VARCHAR(32) DEFAULT 'Balanced',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips Table
CREATE TABLE trips (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trip Stops Table (Cities)
CREATE TABLE trip_stops (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) REFERENCES trips(id) ON DELETE CASCADE,
  city_name VARCHAR(128) NOT NULL,
  state VARCHAR(128),
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  lodging_name VARCHAR(255),
  lodging_cost NUMERIC(10, 2) DEFAULT 0,
  order_index INTEGER NOT NULL
);

-- Scheduled Activities Table
CREATE TABLE scheduled_activities (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) REFERENCES trips(id) ON DELETE CASCADE,
  stop_id VARCHAR(64) REFERENCES trip_stops(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  day_date DATE NOT NULL,
  start_time VARCHAR(8) NOT NULL,
  end_time VARCHAR(8) NOT NULL,
  cost NUMERIC(10, 2) DEFAULT 0,
  transit_mode VARCHAR(64),
  location VARCHAR(255)
);

-- Expenses Table
CREATE TABLE expenses (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) REFERENCES trips(id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  date DATE NOT NULL,
  description TEXT
);
```

### Implementation Steps

1. **Authentication State & Gate**:
   - Update `src/services/db.ts` to manage active session, login/signup/logout methods, and demo credentials.
   - Update `src/App.tsx` navigation guards so visiting protected screens (`dashboard`, `trips`, `trip_workspace`, `settings`, `admin`) when unauthenticated routes directly to the dedicated `login` view.
2. **Dedicated Full-Screen Login / Signup View**:
   - Convert `AuthModal.tsx` into a robust `AuthView.tsx` with email/password validation, demo 1-click login for Aarav Sharma, sign-up form, and password recovery simulation.
3. **Admin & Analytics Screen (`AdminAnalyticsView.tsx`)**:
   - Create screen #13 with aggregated trip statistics, most popular Indian destinations, average budget distribution, and Reality Check resolution rates.
4. **Enrich Indian Circuits & Data**:
   - Ensure Rajasthan, Ladakh, Kerala, Varanasi, and Goa have complete city catalogs, curated activities, and realistic Indian logistics.
   - Verify `formatINR` Lakhs/Thousands formatting across all 13 screens.
5. **Verification & Build**:
   - Compile applet with `compile_applet` and verify end-to-end user navigation from public landing page through login and trip management.
