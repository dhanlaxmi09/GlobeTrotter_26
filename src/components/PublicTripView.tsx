import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  Compass, 
  Share2 
} from 'lucide-react';
import { Trip, TripStop, ScheduledActivity, Expense, formatINR } from '../types/travel';
import { runTripRealityCheck } from '../services/realityCheck';

interface PublicTripViewProps {
  trip: Trip;
  stops: TripStop[];
  activities: ScheduledActivity[];
  expenses: Expense[];
  onBack: () => void;
  onCloneToMyAccount: (tripId: string) => void;
}

export const PublicTripView: React.FC<PublicTripViewProps> = ({
  trip,
  stops,
  activities,
  expenses,
  onBack,
  onCloneToMyAccount,
}) => {
  const [copied, setCopied] = useState(false);
  const realityCheck = runTripRealityCheck(trip, stops, activities, expenses);

  const datesInRange: string[] = [];
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    datesInRange.push(d.toISOString().split('T')[0]);
  }

  const activitiesCost = activities.reduce((s, a) => s + (a.cost || 0), 0);
  const expensesCost = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCost = activitiesCost + expensesCost;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white animate-fadeIn">
      
      {/* Top Banner with Clone Action */}
      <div className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Shared Itinerary</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => onCloneToMyAccount(trip.id)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Fork / Copy Trip to My Account</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={trip.cover_image}
          alt={trip.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/60 to-[#0b0f17]/20" />
        
        <div className="absolute bottom-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>GlobeTrotter Verified Itinerary · Screen 11</span>
            <span className="text-white/20">·</span>
            <span>Feasibility: {realityCheck.feasibilityScore}%</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white">
            {trip.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{trip.start_date} → {trip.end_date}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{trip.destination_summary}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">₹</span>
              <span>Total Est: {formatINR(totalCost)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Description */}
        {trip.description && (
          <div className="p-6 rounded-2xl bg-[#121824] border border-white/10">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Trip Overview
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {trip.description}
            </p>
          </div>
        )}

        {/* Route Stops */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white">Route & Destinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stops.map((stop) => (
              <div key={stop.id} className="p-4 rounded-xl bg-[#121824] border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Stop #{stop.stop_order} · {stop.country}
                </span>
                <h4 className="font-serif font-bold text-white text-base">{stop.city_name}</h4>
                <div className="text-xs text-slate-400 font-mono">
                  {stop.arrival_date} → {stop.departure_date}
                </div>
                {stop.accommodation_name && (
                  <div className="text-[11px] text-slate-300 pt-1">
                    Stay: {stop.accommodation_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Day-by-Day Itinerary */}
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-white">Full Day-by-Day Schedule</h2>
          
          <div className="space-y-6">
            {datesInRange.map((date, idx) => {
              const dayActs = activities
                .filter((a) => a.date === date)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div key={date} className="rounded-2xl bg-[#121824] border border-white/10 overflow-hidden">
                  <div className="px-5 py-3 bg-[#0b0f17] border-b border-white/10 flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-white text-sm">
                      Day {idx + 1} · {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {dayActs.length} scheduled items
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5">
                    {dayActs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">Rest / transit day</p>
                    ) : (
                      dayActs.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-[#0b0f17] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-300 font-semibold bg-white/5 px-2 py-0.5 rounded">
                              {act.start_time} - {act.end_time}
                            </span>
                            <div>
                              <span className="font-semibold text-white block">{act.activity_title}</span>
                              <span className="text-[11px] text-slate-400">{act.category} · {act.location_zone}</span>
                            </div>
                          </div>

                          <span className="font-mono font-bold text-emerald-400">
                            {act.cost > 0 ? formatINR(act.cost) : 'Free'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
