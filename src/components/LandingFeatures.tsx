import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Share2, 
  Clock, 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  Layers
} from 'lucide-react';

interface LandingFeaturesProps {
  onGoToPlanner: () => void;
  onExploreDestinations: () => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({
  onGoToPlanner,
  onExploreDestinations,
}) => {
  return (
    <div className="w-full bg-[#0b0f17] text-white">
      
      {/* SECTION 1: THE TRIP REALITY CHECK (SIGNATURE FEATURE SPOTLIGHT) */}
      <section className="py-20 lg:py-28 border-t border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Kicker & Title */}
          <div className="max-w-3xl mb-16 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Signature Engine</span>
              <span className="text-white/30">·</span>
              <span className="text-slate-400 font-normal">Real-Time Itinerary Verification</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
              Most travel plans fail in reality. GlobeTrotter fixes them before you fly.
            </h2>
            
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Standard planners are dumb spreadsheets that let you book two activities at the same time on opposite sides of a city. Our proprietary <strong className="text-white">Trip Reality Check</strong> audits your schedule against geographic transit windows, human fatigue limits, and budget caps with actionable 1-click fixes.
            </p>
          </div>

          {/* Side-by-side Interactive Comparison: Fragile Plan vs GlobeTrotter Reality Check */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Box 1: The Fragile Typical Itinerary */}
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Unchecked Typical Schedule</span>
                  </div>
                  <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    Feasibility: 34%
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/30">
                    <div className="flex justify-between font-mono text-rose-300">
                      <span>14:00 - 15:30</span>
                      <span>City Palace Jaipur Walk</span>
                    </div>
                    <div className="flex justify-between font-mono text-rose-400 mt-1">
                      <span>15:00 - 16:30</span>
                      <span>Johari Bazaar Stroll (Overlap: 30m)</span>
                    </div>
                    <p className="text-rose-400/80 mt-2 text-[11px]">
                      Collision: Activity starts 30 minutes before preceding palace tour ends, trapped in Old City traffic.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30">
                    <div className="flex justify-between font-mono text-amber-300">
                      <span>Schedule Density</span>
                      <span>11.5 hours non-stop</span>
                    </div>
                    <p className="text-amber-400/80 mt-1 text-[11px]">
                      6 major Rajput forts back-to-back in 38°C midday heat with zero rest or chai buffers.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/30">
                    <div className="flex justify-between font-mono text-rose-300">
                      <span>Total Trip Budget</span>
                      <span>₹89,000 / ₹75,000 (+₹14,000 Over)</span>
                    </div>
                    <p className="text-rose-400/80 mt-1 text-[11px]">
                      VIP private convoy excursion exceeding allocated daily limits.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-rose-500/20 text-xs text-rose-300">
                Result: Rushed vacations, missed train connections, travel fatigue, and budget shock.
              </div>
            </div>

            {/* Box 2: GlobeTrotter Reality Check Verified */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>GlobeTrotter Reality Check Verified</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded font-bold">
                    Feasibility: 98%
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">1-Click Conflict Resolution</span>
                      <span className="text-emerald-400 font-mono text-[11px]">Shifted & Buffered</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      Automatically inserted a 45-minute auto-rickshaw buffer between Amer Fort and Johari Bazaar.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Heat & Fatigue Balancing</span>
                      <span className="text-emerald-400 font-mono text-[11px]">Optimized Pacing</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      Rebalanced 2 optional museum visits to cooler evening slots on Day 4. Daily duration capped at 6.5 hours.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Budget Equilibrium</span>
                      <span className="text-emerald-400 font-mono text-[11px]">₹73,800 / ₹75,000 (₹1,200 Surplus)</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      Replaced luxury vintage convoy with scenic Lake Pichola sunset boat cruise, recovering ₹11,650.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs text-emerald-300">
                  Ready to test on your own Indian itinerary?
                </span>
                <button
                  onClick={onGoToPlanner}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-semibold text-xs hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  Test Rajasthan Demo Fix
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: 4 PILLARS OF GLOBETROTTER */}
      <section className="py-20 border-t border-white/10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold text-white">
              Every detail connected to one single source of truth
            </h3>
            <p className="text-sm sm:text-base text-slate-400">
              Add a city, schedule an activity, or change your dates. GlobeTrotter automatically cascades updates across your calendar, budget, and transit schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Multi-City Builder */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white">Multi-City Sequencing</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sequence multiple stops with exact arrival and departure bounds. Reorder stops with seamless date recalculation.
                </p>
              </div>
              <div className="pt-6 text-xs text-blue-400 font-medium flex items-center gap-1">
                <span>Jaipur → Jodhpur → Udaipur</span>
              </div>
            </div>

            {/* Card 2: Interactive Timeline */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white">Day & Calendar Views</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Toggle between granular hour-by-hour day timelines and high-level calendar overviews. Drag or edit times with live validation.
                </p>
              </div>
              <div className="pt-6 text-xs text-purple-400 font-medium flex items-center gap-1">
                <span>Hour-by-hour precision</span>
              </div>
            </div>

            {/* Card 3: Deep Budget Ledger */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white">Granular Budgeting</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track transport, lodging, meals, and tickets in real time. Visual progress bars flag any day or category running overbudget.
                </p>
              </div>
              <div className="pt-6 text-xs text-amber-400 font-medium flex items-center gap-1">
                <span>Indian Rupee (₹ INR) precision</span>
              </div>
            </div>

            {/* Card 4: 1-Click Publishing & Clones */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white">Public Links & Clones</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Publish read-only trip itineraries for travel companions. Friends can clone the full itinerary into their own account with one tap.
                </p>
              </div>
              <div className="pt-6 text-xs text-amber-400 font-medium flex items-center gap-1">
                <span>Instant read-only token</span>
              </div>
            </div>

          </div>

          {/* Bottom Conversion CTA Strip */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-xl font-serif font-bold text-white">
                Ready to craft an unforgettable journey?
              </h4>
              <p className="text-xs sm:text-sm text-slate-400">
                Explore pre-seeded demo trips or start your custom itinerary in 30 seconds.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onGoToPlanner}
                className="px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-emerald-300 transition-colors cursor-pointer"
              >
                Open Travel Dashboard
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 bg-[#070a10] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-white text-base">GlobeTrotter</span>
            <span className="text-white/20">|</span>
            <span>Intelligent Travel Planning & Reality Verification</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Relational Schema Active</span>
            <span>·</span>
            <span>PostgreSQL & Supabase Architecture Ready</span>
            <span>·</span>
            <span>© 2026 GlobeTrotter</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
