import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Database, 
  DollarSign, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  Copy, 
  Sparkles, 
  MapPin 
} from 'lucide-react';
import { UserProfile, TravelStyle, CityCatalogItem, formatINR } from '../types/travel';
import { db } from '../services/db';

interface ProfileSettingsViewProps {
  currentUser: UserProfile;
  cities: CityCatalogItem[];
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onResetData: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  currentUser,
  cities,
  onUpdateProfile,
  onResetData,
}) => {
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [homeCurrency, setHomeCurrency] = useState(currentUser.home_currency);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>(currentUser.travel_style);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const savedCities = cities.filter((c) => currentUser.saved_destinations.includes(c.id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      full_name: fullName,
      home_currency: homeCurrency,
      travel_style: travelStyle,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const sqlSchema = db.getPostgreSqlSchemaDefinition();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white animate-fadeIn">
      
      {/* Header */}
      <div className="pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>User Configuration · Screen 12</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white">
          Traveler Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your travel pacing, Indian Rupee defaults, and inspect the relational PostgreSQL architecture.
        </p>
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400"
          />
          <div>
            <h2 className="text-lg font-serif font-bold text-white">{currentUser.full_name}</h2>
            <span className="text-xs text-slate-400 font-mono">{currentUser.email}</span>
            <span className="block text-[11px] text-emerald-400 mt-0.5">Active Traveler Account</span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile preferences successfully saved!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Default Display Currency</label>
              <select
                value={homeCurrency}
                onChange={(e) => setHomeCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="INR">INR (₹ - Indian Rupee · Lakhs Notation)</option>
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">Travel Pacing Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Relaxed', 'Balanced', 'Fast-paced', 'Luxury'] as TravelStyle[]).map((style) => (
                <button
                  type="button"
                  key={style}
                  onClick={() => setTravelStyle(style)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    travelStyle === style
                      ? 'bg-emerald-400 text-slate-950 font-semibold border-emerald-400 shadow-sm'
                      : 'bg-[#0b0f17] text-slate-400 border-white/10 hover:border-white/30'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors cursor-pointer shadow-sm"
            >
              Update Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Saved Bookmarks */}
      <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-serif font-bold text-white">Saved Destinations</h3>
          <span className="text-xs text-slate-400">({savedCities.length})</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {savedCities.map((c) => (
            <div key={c.id} className="p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-xs">
              <span className="font-semibold text-white block">{c.city_name}</span>
              <span className="text-[11px] text-slate-400">{c.country}</span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-mono">{formatINR(c.avg_daily_budget)}/day</span>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase & Relational PostgreSQL Schema Inspector */}
      <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-serif font-bold text-white">
                Database Architecture (PostgreSQL & Supabase)
              </h3>
              <p className="text-xs text-slate-400">
                Relational schema with primary keys, foreign key constraints, cascade deletes, and RLS policies.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(sqlSchema);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 2000);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied SQL' : 'Copy DDL'}</span>
          </button>
        </div>

        <div className="bg-[#0b0f17] rounded-xl p-4 border border-white/5 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto whitespace-pre leading-relaxed">
          {sqlSchema}
        </div>
      </div>

      {/* Reset Data Section */}
      <div className="p-6 rounded-2xl bg-[#121824] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-serif font-bold text-white">Reset Demo Data</h3>
          <p className="text-xs text-slate-400">
            Restore initial demo journeys (including intentional Indian reality check conflicts for hackathon evaluation).
          </p>
        </div>

        <button
          onClick={onResetData}
          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All to Seed State</span>
        </button>
      </div>

    </div>
  );
};
