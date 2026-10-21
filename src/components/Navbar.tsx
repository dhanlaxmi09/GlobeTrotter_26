import React from 'react';
import { Compass, User, Sparkles, MapPin, Calendar, ShieldCheck, DollarSign, LogOut, BarChart3, LogIn } from 'lucide-react';
import { UserProfile } from '../types/travel';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCreateTrip: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  isAuthenticated,
  onOpenAuth,
  onLogout,
  onOpenCreateTrip,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0b0f17]/95 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-serif tracking-tight font-bold text-white whitespace-nowrap shrink-0">
              GlobeTrotter
            </span>
            <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase -mt-1 hidden sm:block">
              India Edition
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveView('landing')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeView === 'landing' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Explore
          </button>

          {/* Authenticated Links: Gated strictly behind login */}
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                  activeView === 'dashboard' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('trips')}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                  activeView === 'trips' || activeView === 'trip_workspace' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Trips
              </button>
              <button
                onClick={() => setActiveView('city_discovery')}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                  activeView === 'city_discovery' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Destinations
              </button>
              <button
                onClick={() => setActiveView('activity_discovery')}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                  activeView === 'activity_discovery' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Activities
              </button>
              <button
                onClick={() => setActiveView('admin')}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                  activeView === 'admin' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Analytics
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveView('city_discovery')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeView === 'city_discovery' ? 'text-white border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Destinations
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Auth Posture */}
        <div className="flex items-center gap-3 shrink-0">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <span>Sign Up Free</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCreateTrip}
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                + New Trip
              </button>

              <button
                onClick={() => setActiveView('settings')}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors cursor-pointer"
                title="Profile & Settings"
              >
                <img
                  src={currentUser?.avatar_url || '/src/assets/images/avatar_indian_traveler_1792578895981.jpg'}
                  alt={currentUser?.full_name || 'Traveler'}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs font-medium hidden lg:inline max-w-[100px] truncate">
                  {currentUser?.full_name?.split(' ')[0] || 'Aarav'}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
