/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { LandingFeatures } from './components/LandingFeatures';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { TripsListView } from './components/TripsListView';
import { TripWorkspace } from './components/TripWorkspace';
import { CreateTripModal } from './components/CreateTripModal';
import { CityDiscoveryView } from './components/CityDiscoveryView';
import { ActivityDiscoveryView } from './components/ActivityDiscoveryView';
import { PublicTripView } from './components/PublicTripView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';

import { db } from './services/db';
import { 
  Trip, 
  TripStop, 
  ScheduledActivity, 
  Expense, 
  UserProfile, 
  CityCatalogItem, 
  RealityCheckFix,
  GeneratedItineraryPlan
} from './types/travel';

export default function App() {
  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(db.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(db.getCurrentUser());

  // Navigation State
  const [activeView, setActiveView] = useState<string>('landing');
  const [activeTripId, setActiveTripId] = useState<string>('trip_rajasthan_2026');
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<string>('itinerary');
  const [publicShareToken, setPublicShareToken] = useState<string | null>(null);

  // Modals
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);

  // Core Relational State
  const [trips, setTrips] = useState<Trip[]>(db.getTrips());
  const [stops, setStops] = useState<TripStop[]>([]);
  const [activities, setActivities] = useState<ScheduledActivity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cities, setCities] = useState<CityCatalogItem[]>(db.getCities());

  // Reload relational child collections whenever active trip or trips change
  const reloadData = () => {
    setTrips(db.getTrips());
    setCurrentUser(db.getCurrentUser());
    setIsAuthenticated(db.isAuthenticated());
    setCities(db.getCities());
    if (activeTripId) {
      setStops(db.getStopsByTripId(activeTripId));
      setActivities(db.getActivitiesByTripId(activeTripId));
      setExpenses(db.getExpensesByTripId(activeTripId));
    }
  };

  useEffect(() => {
    reloadData();
  }, [activeTripId]);

  // Auth Handlers
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    reloadData();
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requireAuthOrProceed = (action: () => void) => {
    if (!isAuthenticated) {
      setActiveView('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      action();
    }
  };

  // Handler: Select a trip to open in workspace
  const handleSelectTrip = (tripId: string, initialTab: string = 'itinerary') => {
    requireAuthOrProceed(() => {
      setActiveTripId(tripId);
      setWorkspaceInitialTab(initialTab);
      setActiveView('trip_workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Handler: Create Trip
  const handleCreateTrip = (
    tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_token'>
  ) => {
    requireAuthOrProceed(() => {
      const created = db.createTrip(tripData);
      reloadData();
      handleSelectTrip(created.id, 'itinerary');
    });
  };

  // Handler: Plan trip from Hero
  const handlePlanFromHero = (_destinationId?: string, tripId?: string) => {
    requireAuthOrProceed(() => {
      if (tripId && db.getTripById(tripId)) {
        handleSelectTrip(tripId, 'itinerary');
      } else {
        setIsCreateTripOpen(true);
      }
    });
  };

  // Handler: Duplicate Trip
  const handleDuplicateTrip = (tripId: string) => {
    requireAuthOrProceed(() => {
      const cloned = db.duplicateTrip(tripId);
      if (cloned) {
        reloadData();
        handleSelectTrip(cloned.id, 'itinerary');
      }
    });
  };

  // Handler: Delete Trip
  const handleDeleteTrip = (tripId: string) => {
    requireAuthOrProceed(() => {
      db.deleteTrip(tripId);
      reloadData();
      if (activeTripId === tripId) {
        const remaining = db.getTrips();
        if (remaining.length > 0) {
          setActiveTripId(remaining[0].id);
        } else {
          setActiveView('dashboard');
        }
      }
    });
  };

  // Handler: Apply Reality Check Fix (SIGNATURE FEATURE)
  const handleApplyRealityFix = (fix: RealityCheckFix) => {
    if (!activeTripId) return;
    db.applyRealityCheckFix(activeTripId, fix);
    reloadData();
  };

  // Handler: Add City to Trip
  const handleAddCityToTrip = (city: CityCatalogItem, targetTripId: string) => {
    requireAuthOrProceed(() => {
      const targetTrip = db.getTripById(targetTripId);
      if (!targetTrip) return;

      const existingStops = db.getStopsByTripId(targetTripId);
      db.createStop({
        trip_id: targetTripId,
        city_name: city.city_name,
        country: city.country,
        arrival_date: targetTrip.start_date,
        departure_date: targetTrip.end_date,
        stop_order: existingStops.length + 1,
        accommodation_name: `${city.city_name} Heritage Haveli / Retreat`,
        estimated_lodging_cost: Math.round(city.avg_daily_budget * 0.5),
        image_url: city.image_url,
      });

      reloadData();
      handleSelectTrip(targetTripId, 'itinerary');
    });
  };

  // Handler: Create Trip With City
  const handleCreateTripWithCity = (city: CityCatalogItem) => {
    requireAuthOrProceed(() => {
      const created = db.createTrip({
        title: `${city.city_name} Discovery Expedition`,
        destination_summary: `${city.city_name}, ${city.country}`,
        start_date: '2026-11-15',
        end_date: '2026-11-22',
        total_budget: Math.round(city.avg_daily_budget * 7 * 1.2),
        currency: 'INR',
        cover_image: city.image_url,
        description: `Scenic Indian itinerary centered around ${city.city_name}. ${city.description}`,
        is_public: false,
      });

      // Add first stop
      db.createStop({
        trip_id: created.id,
        city_name: city.city_name,
        country: city.country,
        arrival_date: created.start_date,
        departure_date: created.end_date,
        stop_order: 1,
        accommodation_name: `${city.city_name} Historic Stay`,
        estimated_lodging_cost: Math.round(city.avg_daily_budget * 0.5 * 7),
        image_url: city.image_url,
      });

      reloadData();
      handleSelectTrip(created.id, 'itinerary');
    });
  };

  // Handler: Reset Demo Data
  const handleResetData = () => {
    db.resetToSeedData();
    reloadData();
    setActiveTripId('trip_rajasthan_2026');
    setActiveView('dashboard');
  };

  // Active trips
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || null;
  const publicTrip = publicShareToken ? db.getTripByShareToken(publicShareToken) : null;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-emerald-400 selection:text-slate-950">
      
      {/* Top Bar Navigation (Hidden in Login & Public View) */}
      {activeView !== 'public_view' && activeView !== 'login' && (
        <Navbar
          activeView={activeView}
          setActiveView={(v) => {
            if (['dashboard', 'trips', 'trip_workspace', 'settings', 'admin'].includes(v)) {
              requireAuthOrProceed(() => {
                setActiveView(v);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });
            } else {
              setActiveView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onOpenAuth={() => {
            setActiveView('login');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={handleLogout}
          onOpenCreateTrip={() => {
            requireAuthOrProceed(() => setIsCreateTripOpen(true));
          }}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        
        {/* Screen 1: Login / Signup Screen */}
        {activeView === 'login' && (
          <AuthView
            onSuccess={handleAuthSuccess}
            onReturnLanding={() => {
              setActiveView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Public Landing View */}
        {activeView === 'landing' && (
          <div>
            <LandingHero
              onPlanTrip={handlePlanFromHero}
              onExploreCatalog={() => {
                setActiveView('city_discovery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <LandingFeatures
              onGoToPlanner={() => {
                requireAuthOrProceed(() => {
                  setActiveView('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                });
              }}
              onExploreDestinations={() => {
                setActiveView('city_discovery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Screen 2: Dashboard / Home Screen */}
        {activeView === 'dashboard' && currentUser && (
          <DashboardView
            currentUser={currentUser}
            trips={trips}
            stops={db.getStopsByTripId(trips[0]?.id || '')}
            activities={db.getActivitiesByTripId(trips[0]?.id || '')}
            expenses={db.getExpensesByTripId(trips[0]?.id || '')}
            cities={cities}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={() => setIsCreateTripOpen(true)}
            onExploreCities={() => {
              setActiveView('city_discovery');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Screen 4: My Trips Screen */}
        {activeView === 'trips' && (
          <TripsListView
            trips={trips}
            stops={stops}
            activities={activities}
            expenses={expenses}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={() => setIsCreateTripOpen(true)}
            onDuplicateTrip={handleDuplicateTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        )}

        {/* Screens 5, 6, 9, 10: Trip Workspace (Itinerary Builder, Itinerary View, Budget, Timeline) */}
        {activeView === 'trip_workspace' && activeTrip && (
          <TripWorkspace
            trip={activeTrip}
            stops={stops}
            activities={activities}
            expenses={expenses}
            initialTab={workspaceInitialTab}
            onBack={() => setActiveView('trips')}
            onUpdateTrip={(updates) => {
              db.updateTrip(activeTrip.id, updates);
              reloadData();
            }}
            onCreateStop={(stopData) => {
              db.createStop(stopData);
              reloadData();
            }}
            onUpdateStop={(stopId, updates) => {
              db.updateStop(stopId, updates);
              reloadData();
            }}
            onDeleteStop={(stopId) => {
              db.deleteStop(stopId);
              reloadData();
            }}
            onReorderStops={(stopIds) => {
              db.reorderStops(activeTrip.id, stopIds);
              reloadData();
            }}
            onCreateActivity={(activityData) => {
              db.createScheduledActivity(activityData);
              reloadData();
            }}
            onUpdateActivity={(actId, updates) => {
              db.updateScheduledActivity(actId, updates);
              reloadData();
            }}
            onDeleteActivity={(actId) => {
              db.deleteScheduledActivity(actId);
              reloadData();
            }}
            onCreateExpense={(expenseData) => {
              db.createExpense(expenseData);
              reloadData();
            }}
            onDeleteExpense={(expId) => {
              db.deleteExpense(expId);
              reloadData();
            }}
            onApplyRealityFix={handleApplyRealityFix}
            onDuplicateTrip={() => handleDuplicateTrip(activeTrip.id)}
            onOpenPublicView={(token) => {
              setPublicShareToken(token);
              setActiveView('public_view');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Screen 7: City Discovery & Search */}
        {activeView === 'city_discovery' && (
          <CityDiscoveryView
            cities={cities}
            savedCityIds={currentUser?.saved_destinations || []}
            trips={trips}
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => {
              setActiveView('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleSaveCity={(cityId) => {
              if (currentUser) {
                db.toggleSaveDestination(cityId);
                reloadData();
              }
            }}
            onAddCityToTrip={handleAddCityToTrip}
            onCreateTripWithCity={handleCreateTripWithCity}
            onCreateGeneratedTrip={(plan: GeneratedItineraryPlan) => {
              requireAuthOrProceed(() => {
                const newTrip = db.createFullGeneratedTrip(plan);
                reloadData();
                handleSelectTrip(newTrip.id, 'itinerary');
              });
            }}
          />
        )}

        {/* Screen 8: Activity Discovery & Search */}
        {activeView === 'activity_discovery' && (
          <ActivityDiscoveryView
            activities={db.getActivityCatalog()}
            trips={trips}
            stops={stops}
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => {
              setActiveView('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onScheduleActivity={(actData) => {
              db.createScheduledActivity(actData);
              reloadData();
              setActiveView('trip_workspace');
            }}
          />
        )}

        {/* Screen 11: Public / Shared Itinerary View */}
        {activeView === 'public_view' && publicTrip && (
          <PublicTripView
            trip={publicTrip}
            stops={db.getStopsByTripId(publicTrip.id)}
            activities={db.getActivitiesByTripId(publicTrip.id)}
            expenses={db.getExpensesByTripId(publicTrip.id)}
            onBack={() => {
              setActiveView(isAuthenticated ? 'trips' : 'landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCloneToMyAccount={() => {
              requireAuthOrProceed(() => {
                handleDuplicateTrip(publicTrip.id);
              });
            }}
          />
        )}

        {/* Screen 12: User Profile & Settings Screen */}
        {activeView === 'settings' && currentUser && (
          <ProfileSettingsView
            currentUser={currentUser}
            cities={cities}
            onUpdateProfile={(updates) => {
              db.updateUserProfile(updates);
              reloadData();
            }}
            onResetData={handleResetData}
          />
        )}

        {/* Screen 13: Admin & Analytics Dashboard */}
        {activeView === 'admin' && (
          <AdminAnalyticsView
            onBackToDashboard={() => {
              setActiveView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Screen 3: Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onSubmit={handleCreateTrip}
      />
    </div>
  );
}
