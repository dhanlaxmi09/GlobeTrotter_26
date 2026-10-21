import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  Activity, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { db } from '../services/db';
import { formatINR } from '../types/travel';

interface AdminAnalyticsViewProps {
  onBackToDashboard: () => void;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ onBackToDashboard }) => {
  const analytics = db.getPlatformAnalytics();
  const trips = db.getTrips();
  const currentUser = db.getCurrentUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Platform Governance & Telemetry · Screen 13</span>
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
            Admin & Travel Trends Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregate data metrics across Indian multi-city itineraries, Rupee capital allocation, and Reality Check resolutions.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          ← Return to Dashboard
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Trips Created</span>
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {analytics.totalTrips}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% active adoption this month</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Rupee Capital Planned</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatINR(analytics.totalBudgetManaged, { compact: true })}
          </div>
          <div className="text-[11px] text-slate-400">
            Across {analytics.totalStops} Indian city hubs
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Reality Check Health Rate</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {analytics.realityCheckStats.overallFeasibilityRate}%
          </div>
          <div className="text-[11px] text-cyan-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{analytics.realityCheckStats.autoFixedCount} conflict auto-fixes applied</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Scheduled Activities</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {analytics.totalActivities}
          </div>
          <div className="text-[11px] text-slate-400">
            Avg {(analytics.totalActivities / Math.max(1, analytics.totalTrips)).toFixed(1)} activities / trip
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Destinations & Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Cities */}
        <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Top Indian Destinations</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">By Stop Allocation</span>
          </div>

          <div className="space-y-3">
            {analytics.topCities.map((c, idx) => {
              const maxCount = Math.max(...analytics.topCities.map(x => x.count), 1);
              const pct = Math.round((c.count / maxCount) * 100);
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">
                      {idx + 1}. {c.name}
                    </span>
                    <span className="font-mono text-slate-400">{c.count} stops planned</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Budget Allocation */}
        <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Rupee Spend Distribution</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Platform Aggregation</span>
          </div>

          <div className="space-y-3">
            {Object.entries(analytics.categorySpending).map(([category, amount]) => {
              const total = Object.values(analytics.categorySpending).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{category}</span>
                    <span className="font-mono text-emerald-400">
                      {formatINR(amount)} <span className="text-slate-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400/80 rounded-full" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="p-6 rounded-2xl bg-[#121824] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Live Trips Database Ledger</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Relational Foreign Key Bound</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono">
                <th className="pb-3 pr-4">Trip Title</th>
                <th className="pb-3 pr-4">Dates</th>
                <th className="pb-3 pr-4">Budget (INR)</th>
                <th className="pb-3 pr-4">Visibility</th>
                <th className="pb-3">Share Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-medium text-white flex items-center gap-2">
                    <img 
                      src={t.cover_image} 
                      alt="" 
                      className="w-7 h-7 rounded-md object-cover border border-white/10" 
                    />
                    <span>{t.title}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 font-mono">
                    {t.start_date} → {t.end_date}
                  </td>
                  <td className="py-3 pr-4 text-emerald-400 font-mono font-medium">
                    {formatINR(t.total_budget)}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      t.is_public ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-white/10'
                    }`}>
                      {t.is_public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 font-mono text-[11px]">
                    {t.share_token}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management & Integrity Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#121824] to-[#121824] border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Active Authenticated Session</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-white">{currentUser?.full_name || 'Traveler'}</strong> ({currentUser?.email || 'Demo'}). Relational foreign key constraints and cascade deletions active.
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          PostgreSQL Ready
        </div>
      </div>
    </div>
  );
};
